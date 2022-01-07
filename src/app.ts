import express from 'express';
import { getSystemetData, SystemetData } from './DataCollection';
import fs from 'fs';
import { CronJob } from 'cron';
import haversine from 'haversine';

const app = express();
const port = 3000;

const storesFile = `${process.env.PWD}/data/stores/2520.json` // the last store file

let sysData: SystemetData | undefined = undefined

const getSystemetDataFiles = (renew: boolean) => {
  getSystemetData(renew).then(data => {
    sysData = data
  })
}

const sysDataScheduler = new CronJob('0 0 * * 0', () => getSystemetData(true), () => console.log("Finished renewing data."), true, 'Europe/Stockholm');
sysDataScheduler.start()

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
});

app.get("/products", (req, res) => {
  let filteredProds = sysData?.products

  if (req.query.productId) {
    res.send(sysData?.products.filter(product => product.productId === req.query.productId))
    return
  }
  if (req.query.category) {
    const cat = {
      "vin": "vin",
      "öl": "öl",
      "cider": "cider & blanddrycker",
      "sprit": "sprit"
    }[req.query.category!.toString().toLowerCase()]

    filteredProds = filteredProds?.filter(product => product.categoryLevel1 && product.categoryLevel1.toLowerCase() === cat)
  }
  if (req.query.name) {
    filteredProds = filteredProds?.filter(product => product.productNameBold.toLowerCase().includes(req.query.name!.toString().toLowerCase()))
  }
  if (req.query.minPrice) {
    filteredProds = filteredProds?.filter(product => product.price >= parseFloat(req.query.minPrice!.toString()))
  }
  if (req.query.maxPrice) {
    filteredProds = filteredProds?.filter(product => product.price <= parseFloat(req.query.maxPrice!.toString()))
  }
  if (req.query.producer) {
    filteredProds = filteredProds?.filter(product => product.producerName && product.producerName.toLowerCase().includes(req.query.producer!.toString().toLowerCase()))
  }

  res.status(200).send(filteredProds)
})

app.get("/stores", (req, res) => {
  if (req.query.siteId) {
    res.send(sysData?.stores.filter(store => store.siteId === req.query.siteId))
    return
  } else if (req.query.city) {
    res.send(sysData?.stores.filter(store => store.city && store.city.toLowerCase() === req.query.city!.toString().toLowerCase()))
    return
  } else if (req.query.lat && req.query.lng) {
    const lat = parseFloat(req.query.lat!.toString())
    const lng = parseFloat(req.query.lng!.toString())

    if (req.query.maxdist) {
      const maxdist = parseFloat(req.query.maxdist!.toString())
      res.send(sysData?.stores.filter(store => haversine({ latitude: lat, longitude: lng }, { latitude: store.latitude, longitude: store.longitude }, { unit: 'km' }) <= maxdist))
      return
    } else {
      const storeDistances = sysData?.stores.map(store => {
        return {
          store: store,
          distance: haversine({ latitude: lat, longitude: lng }, { latitude: store.latitude, longitude: store.longitude }, { unit: 'km' })
        }
      })

      const nearest = storeDistances?.sort((a, b) => a.distance - b.distance)[0]

      res.send(nearest?.store)
      return
    }
  }

  res.send(sysData?.stores)
})