import { Endpoint } from "../app"

export const v1GetProducts: Endpoint = {
  path: "/v1/products",
  callback: (req, res, sysData) => {
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
  }
}