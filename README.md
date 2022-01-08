# systembolaget-api

A public REST API for retrieving information about Systembolaget's products, and which products that are available in which store

## But Systembolaget has [removed their API for retrieving products](https://api-portal.systembolaget.se/api-update-blog/changes-in-the-api-portal), so how does this work?

That is correct, they no longer provide an official API for getting product information, they now **only** provide an API for getting information about their stores. However, if one only spends a minute looking at the network traffic when searching for products at [systembolaget.se](https://www.systembolaget.se), you'll see that the front end uses an API to retrieve all products available in a certain store. 

Its product search endpoint is this: `https://api-extern.systembolaget.se/sb-api-ecommerce/v1/productsearch`, but it requires an API key to be used, which can be found in all requests in the network traffic, `cfc702aed3094c86b92d6d4ff7a54c84` :).

I start by getting all stores through their official API for store information, and using those, I lookup all products that exist in each store by supplying a `storeId` parameter to their product search endpoint. Unfortunately they've restricted the amount of products per page that they return to 30, so I've had to make about ~60 requests for each of the 450 stores to get all the products. Data is recollected on a weekly basis.

### `GET /products` 
Allows for retrieving information about all products in Systembolaget's assortment. Supplying no parameters returns all products.

- `productId: number`, returns the product with the corresponding product identifier.
- `category: enum[vin, öl, cider, sprit]`, filters out products which match the given category.
- `name: string`, filters out products with names that contains the given substring. (not case-sensitive)
- `minPrice: number`, filters out products which have a price that is at *least* the given number.
- `maxPrice: number`, filters out products which have a price that is at *most* the given number.
- `producer: string`, filters out products with producers whose name contains the given substring. 

### `GET /stores` 
Allows for retrieving information about all stores that Systembolaget has, together with which products they have in that specific store. The following parameters cannot be used together, instead they should be seen as different ways of finding and looking up stores. Supplying no parameters returns all stores.

- `siteId: string`, returns the store with the corresponding site identifier.
- `city: string`, returns all stores in the given city, e.g. `malmö`. (not case-sensitive).
- `lat: float, lng: float`, returns the closest store to the given coordinates. e.g `lat=57.68751&lng=11.9785` would give the store located at Kapellplatsen in Gothenburg (calculates distance using the great-circle distance).
- `lat: float, lng: float, maxdist: number`, returns all stores within a radius of `maxdist` kilometers from the given coordinates.