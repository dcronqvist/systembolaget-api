import express from 'express';
import { getSystemetData, SystemetData } from './DataCollection';
import fs from 'fs';
import { CronJob } from 'cron';
import haversine from 'haversine';
import { v1GetProducts } from './v1/products';
import { v1GetStores } from './v1/stores';
import { initMongoDB } from './Database';

const app = express();
const port = 3000;

export type Endpoint = {
  path: string,
  callback: (req: express.Request, res: express.Response) => void
}

const endpoints: Endpoint[] = [
  {
    path: '/',
    callback: (req, res) => { res.status(200).send() }
  },
  v1GetProducts,
  v1GetStores
]

const storesFile = `${process.env.PWD}/data/stores/2520.json` // the last store file
let startTime: Date = new Date()

const getDevMode = () => {
  return process.env.DEV_MODE === 'true'
}

if (getDevMode()) {
  console.log("Running in dev mode")
}

const doError = (res: express.Response, code: number, message: string) => {
  res.status(code).send({
    error: message
  })
}

const sysDataScheduler = new CronJob('0 0 * * 0', () => getSystemetData(true, getDevMode()), () => console.log("Finished renewing data."), true, 'Europe/Stockholm');
sysDataScheduler.start()

app.use((req, res, next) => {
  next()
})

endpoints.forEach(endpoint => {
  app.get(endpoint.path, (req, res) => {
    endpoint.callback(req, res)
  })
  console.log("Registered endpoint", endpoint.path)
})

app.listen(port, () => {
  console.log(`Running on port ${port}.`);
  initMongoDB()
  getSystemetData(true, getDevMode())
})