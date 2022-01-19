import express from 'express';
import { getSystemetData, SystemetData } from './DataCollection';
import fs from 'fs';
import { CronJob } from 'cron';
import haversine from 'haversine';
import { v1GetProducts } from './v1/products';
import { v1GetStores } from './v1/stores';

const app = express();
const port = 3000;

export type Endpoint = {
  path: string,
  callback: (req: express.Request, res: express.Response, sysData: SystemetData | undefined) => void
}

const endpoints: Endpoint[] = [
  {
    path: '/',
    callback: (req, res, sysData) => { res.status(200).send() }
  },
  v1GetProducts,
  v1GetStores
]

const storesFile = `${process.env.PWD}/data/stores/2520.json` // the last store file
let sysData: SystemetData | undefined = undefined
let startTime: Date = new Date()

const getDevMode = () => {
  return process.env.DEV_MODE === 'true'
}

if (getDevMode()) {
  console.log("Running in dev mode")
}

const getSystemetDataFiles = async (renew: boolean) => {
  return getSystemetData(renew, getDevMode()).then(data => {
    sysData = data
    console.log("Data loaded")
  })
}

const doError = (res: express.Response, code: number, message: string) => {
  res.status(code).send({
    error: message
  })
}

const sysDataScheduler = new CronJob('0 0 * * 0', () => getSystemetData(true, getDevMode()), () => console.log("Finished renewing data."), true, 'Europe/Stockholm');
sysDataScheduler.start()

app.use((req, res, next) => {
  if (!sysData) {
    doError(res, 503, `API has recently been updated (${startTime.toUTCString()}), data is still being collected and loaded. Please wait and try again later.`)
  }

  next()
})

endpoints.forEach(endpoint => {
  app.get(endpoint.path, (req, res) => {
    endpoint.callback(req, res, sysData)
  })
  console.log("Registered endpoint", endpoint.path)
})

app.listen(port, () => {
  console.log(`Running on port ${port}.`);

  if (!fs.existsSync(storesFile)) {
    console.log("No stores file found, creating one.")
    getSystemetDataFiles(true)
  } else {
    if (process.argv && process.argv[2] === '--force-data') {
      console.log("Forcing data collection, overwriting existing file.")
      getSystemetDataFiles(true)
    } else {
      console.log("Stores file exists, use --force-data if you want to overwrite it with new data.")
      getSystemetDataFiles(false)
    }
  }
})