import { Endpoint } from "../app"
import haversine from "haversine"

export const v1GetStores: Endpoint = {
  path: "/v1/stores",
  callback: (req, res, sysData) => {
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

    res.send(sysData?.stores.map(store => store.siteId))
  }
}