import axios, { AxiosResponse } from "axios"
import { updateProduct, updateStore } from "./Database"

export type Store = {
  siteId: string,
  alias: string,
  isActive: boolean,
  isBlocked: boolean,
  address: string
  postalCode: string,
  city: string,
  phone: string,
  county: string,
  latitude: number,
  longitude: number,
  products: string[] | undefined,
  latestUpdated: string
}

export type Product = {
  productId: string,
  productNumber: string,
  productNameBold: string,
  productNameThin: string,
  category: string | undefined,
  productNumberShort: string,
  producerName: string,
  suppliername: string,
  isKosher: boolean,
  bottleTextShort: string,
  isOrganic: boolean,
  isEthical: boolean,
  isCompletelyOutOfStock: boolean,
  isTemporaryOutOfStock: boolean,
  alcoholPercentage: number,
  volume: number,
  price: number,
  country: string,
  originLevel1: string,
  originLevel2: string,
  categoryLevel1: string,
  categoryLevel2: string,
  categoryLevel3: string,
  categoryLevel4: string,
  customCategoryTitle: string,
  assortmentText: string,
  usage: string,
  taste: string,
  images: string[]
  latestUpdated: string
}

export type SystemetData = {
  stores: Store[],
  products: Product[]
}

const mapAPIProductToProduct = (product: any): Product => {
  return {
    productId: product.productId,
    productNumber: product.productNumber,
    productNameBold: product.productNameBold,
    productNameThin: product.productNameThin,
    category: product.category,
    productNumberShort: product.productNumberShort,
    producerName: product.producerName,
    suppliername: product.suppliername,
    isKosher: product.isKosher,
    bottleTextShort: product.bottleTextShort,
    isOrganic: product.isOrganic,
    isEthical: product.isEthical,
    isCompletelyOutOfStock: product.isCompletelyOutOfStock,
    isTemporaryOutOfStock: product.isTemporaryOutOfStock,
    alcoholPercentage: product.alcoholPercentage,
    volume: product.volume,
    price: product.price,
    country: product.country,
    originLevel1: product.originLevel1,
    originLevel2: product.originLevel2,
    categoryLevel1: product.categoryLevel1,
    categoryLevel2: product.categoryLevel2,
    categoryLevel3: product.categoryLevel3,
    categoryLevel4: product.categoryLevel4,
    customCategoryTitle: product.customCategoryTitle,
    assortmentText: product.assortmentText,
    usage: product.usage,
    taste: product.taste,
    images: product.images.map((x: any) => `${x.imageUrl}.png`),
    latestUpdated: new Date().toISOString()
  }
}

const getStores = (): Promise<Store[]> => {
  const url = "https://api-extern.systembolaget.se/site/V2/Store"
  return axios.get(url, {
    headers: {
      "Ocp-Apim-Subscription-Key": process.env.OCP_APIM_KEY!
    }
  }).then(res => {
    const storeList = res.data

    return storeList.map((store: any): Store => {
      return {
        siteId: store.siteId,
        alias: store.alias,
        isActive: store.isActive,
        isBlocked: store.isBlocked,
        address: store.address,
        postalCode: store.postalCode,
        city: store.city,
        phone: store.phone,
        county: store.county,
        latitude: store.position.latitude,
        longitude: store.position.longitude,
        products: undefined,
        latestUpdated: new Date().toISOString()
      }
    })
  }).catch(err => {
    console.log(err)
  })
}

const getFromUrl = async (url: string): Promise<AxiosResponse> => {
  const headers = {
    "accept": "application/json",
    "access-control-allow-origin": "*",
    // Not my API key, this key can be found in plaintext in 
    // the requests made on the frontend of systembolaget.se
    "ocp-apim-subscription-key": "cfc702aed3094c86b92d6d4ff7a54c84",
    "Referer": "https://www.systembolaget.se/",
  }

  return axios.get(url, {
    headers: headers
  }).then(res => {
    return res
  }).catch(err => {
    return getFromUrl(url)
  })
}

const getProductsFromUrl = async (url: string): Promise<Product[]> => {
  return getFromUrl(url).then(res => {
    try {
      return res?.data.products.map((product: any) => {
        return mapAPIProductToProduct(product)
      })
    }
    catch (error) {
      console.log("Failed to retrieve products from url: " + url + ", " + error)
    }
  })
}

const getProductsOnStorePage = async (storeId: string, page: number): Promise<Product[]> => {
  const url = `https://api-extern.systembolaget.se/sb-api-ecommerce/v1/productsearch/search?size=30&page=${page}&isEcoFriendlyPackage=false&isInDepotStockForFastDelivery=false&storeId=${storeId}&isInStoreAssortmentSearch=true`
  return getProductsFromUrl(url)
}

const getProductAmountFromUrl = async (url: string): Promise<number> => {
  return getFromUrl(url).then(res => {
    return res.data.metadata.docCount
  })
}

const getStoreProductsAmount = async (storeId: string): Promise<number> => {
  const url = `https://api-extern.systembolaget.se/sb-api-ecommerce/v1/productsearch/search?size=30&page=1&isEcoFriendlyPackage=false&isInDepotStockForFastDelivery=false&storeId=${storeId}&isInStoreAssortmentSearch=true`
  return getProductAmountFromUrl(url)
}

const getProductsInStore = async (storeId: string): Promise<Product[]> => {
  return getStoreProductsAmount(storeId).then(async amount => {
    if (amount < 1) {
      return []
    }
    const pages = Math.ceil(amount / 30)
    let allStoreProds: Product[] = []

    for (let page = 1; page < pages; page++) {
      console.log("Getting page", page, "of", pages, "for store", storeId)
      const prods = await getProductsOnStorePage(storeId, page)

      prods.filter(p => !allStoreProds.includes(p)).forEach(async p => {
        updateProduct(p.productId, p)
      })

      allStoreProds = allStoreProds.concat(prods)
    }

    return allStoreProds
  })
}

const getAllProducts = async (): Promise<Product[]> => {
  const url = (page: number) => `https://api-extern.systembolaget.se/sb-api-ecommerce/v1/productsearch/search?size=30&page=${page}&isEcoFriendlyPackage=false&isInDepotStockForFastDelivery=false`

  return getProductAmountFromUrl(url(1)).then(async amount => {
    if (amount < 1) {
      return []
    }
    const pages = Math.ceil(amount / 30)
    let allProducts: Product[] = []

    for (let page = 1; page < pages; page++) {
      console.log("Getting page", page, "of", pages)
      const prods = await getProductsFromUrl(url(page))
      allProducts = allProducts.concat(prods)
    }
    return allProducts
  })

}

export const getSystemetData = async (renew: boolean, devmode: boolean): Promise<void> => {
  if (devmode) {
    return await getStores().then(async stores => {
      for (let i = 0; i < 2; i++) {
        console.log("Getting products for store", stores[i].siteId)
        const store = stores[i];
        const products = await getProductsInStore(store.siteId)
        store.products = products.map(p => p.productId)

        updateStore(stores[i].siteId, store)
      }

      console.log("Done!")
    })
  }
  if (renew) {
    return await getStores().then(async stores => {
      for (let i = 0; i < stores.length; i++) {
        console.log("Getting products for store", stores[i].siteId)
        const store = stores[i];
        const products = await getProductsInStore(store.siteId)
        store.products = products.map(p => p.productId)

        updateStore(stores[i].siteId, store)
      }

      console.log("Done!")
    })
  }
}