# systembolaget-api

A public REST API for retrieving information about Systembolaget's products, and which products that are available in which store


## Endpoints

`GET /products` Allows for retrieving information about all products in Systembolaget's assortment. Supplying no parameters returns all products.

- `productId: number`, returns the product with the corresponding product identifier.
- `category: enum[vin, öl, cider, sprit]`, filters out products which match the given category.
- `name: string`, filters out products with names that contains the given substring. (not case-sensitive)
- `minPrice: number`, filters out products which have a price that is at *least* the given number.
- `maxPrice: number`, filters out products which have a price that is at *most* the given number.
- `producer: string`, filters out products with producers whose name contains the given substring. 

`GET /stores` Allows for retrieving information about all stores that Systembolaget has, together with which products they have in that specific store. The following parameters cannot be used together, instead they should be seen as different ways of finding and looking up stores. Supplying no parameters returns all stores.

- `siteId: string`, returns the store with the corresponding site identifier.
- `city: string`, returns all stores in the given city, e.g. `malmö`. (not case-sensitive).
- `lat: float, lng: float`, returns the closest store to the given coordinates. e.g `lat=57.68751&lng=11.9785` would give the store located at Kapellplatsen in Gothenburg (calculates distance using the great-circle distance).
- `lat: float, lng: float, maxdist: number`, returns all stores within a radius of `maxdist` kilometers from the given coordinates.