import { MongoClient } from "mongodb";
import { Product, Store } from "./DataCollection";

const mongoClient = new MongoClient(process.env.MONGO_URI!);

export const initMongoDB = async () => {
  try {
    await mongoClient.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log(error);
  }
};

export const updateProduct = async (productId: string, product: Product) => {
  const systembolaget = mongoClient.db("systembolaget-api");
  const products = systembolaget.collection("products");

  products
    .findOneAndReplace({ productId: productId }, product, { upsert: true })
    .catch((err) => {
      console.log(err);
    });
};

export const getAllProducts = async (): Promise<Product[]> => {
  return mongoClient.db("systembolaget-api").collection("products").find().toArray().then(res => {
    return res.map(p => p as unknown as Product)
  })
}

export const getAllStores = async (): Promise<Store[]> => {
  return mongoClient.db("systembolaget-api").collection("stores").find().toArray().then(res => {
    return res.map(p => p as unknown as Store)
  })
}

export const updateStore = async (storeId: string, store: Store) => {
  const systembolaget = mongoClient.db("systembolaget-api");
  const stores = systembolaget.collection("stores");

  stores.findOneAndReplace({ siteId: storeId }, store, { upsert: true }).catch(err => {
    console.log(err)
  })
}
