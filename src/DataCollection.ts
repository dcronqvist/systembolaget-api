import axios, { AxiosResponse } from "axios"
import fs from "fs"

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
  products: Product[] | undefined,
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
  taste: string
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
    return res?.data.products.map((product: any) => {
      return mapAPIProductToProduct(product)
    })
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

export const getSystemetData = async (renew: boolean): Promise<SystemetData> => {
  if (renew) {
    return await getStores().then(async stores => {
      for (let i = 0; i < stores.length; i++) {
        console.log("Getting products for store", stores[i].siteId)
        const store = stores[i];
        const products = await getProductsInStore(store.siteId)
        store.products = products

        fs.writeFile(`${process.env.PWD}/data/stores/${store.siteId}.json`, JSON.stringify(store), {
          encoding: 'utf8',
        }, (err) => {
          if (err) {
            console.log("Failed to write store", store.siteId, err)
          } else {
            console.log("Wrote store", store.siteId)
          }
        })
      }

      console.log("Getting all products...")

      let allProducts: Product[] = []
      for (let i = 0; i < stores.length; i++) {
        const store = stores[i];

        for (let j = 0; j < store.products!.length; j++) {
          const prod = store.products![j];
          if (!allProducts.find(p => p.productId === prod.productId)) {
            allProducts = allProducts.concat(prod)
          }
        }
      }

      console.log("Done!")

      return {
        stores: stores,
        products: allProducts
      }
    })
  } else {
    const files = fs.readdirSync(`${process.env.PWD}/data/stores`).filter(f => f.endsWith(".json"))

    const stores: Store[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const storeId = file.split(".")[0]
      const store = JSON.parse(fs.readFileSync(`${process.env.PWD}/data/stores/${file}`, 'utf8'))
      stores.push(store)
    }

    let allProducts: Product[] = []
    for (let i = 0; i < stores.length; i++) {
      const store = stores[i];

      for (let j = 0; j < store.products!.length; j++) {
        const prod = store.products![j];
        if (!allProducts.find(p => p.productId === prod.productId)) {
          allProducts = allProducts.concat(prod)
        }
      }
    }

    return {
      stores: stores,
      products: allProducts
    }
  }
}