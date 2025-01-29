const { db } = require('../utils/config')

const initialProducts = [
  {
    id: 1,
    name: 'Adidas UltraBoost 2025 Running Shoes',
    description: 'Perfectas para correr largas distancias con comodidad excepcional.',
    category: 'Men',
    size: '43',
    color: 'Blanco',
    price: '150000.00',
    stock: 30,
    date_added: '2025-02-15T00:00:00.000Z',
    image_key: 'd13a9f4233f1f35e6d1f22b1d8c24c6b3b5c4f8b0e7d34d5b4b0d6e5f9a26a69',
    gender_id: 2,
    season_id: 2,
    age_id: 2,
    image_url: 'https://oiga-files.s3.us-east-1.amazonaws.com/d13a9f4233f1f35e6d1f22b1d8c24c6b3b5c4f8b0e7d34d5b4b0d6e5f9a26a69?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA46ZDE5FNF7BSL6PH%2F20250215%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250215T103654Z&X-Amz-Expires=60&X-Amz-Signature=f7d9c2a6332d9bc0c1a4a7e7f06040c1d88bc3a40543f763e4b16d6f4ccf4db7&X-Amz-SignedHeaders=host&x-id=GetObject'
  },
  {
    id: 2,
    name: 'Nike Air Max 2025 Running Shoes',
    description: 'Confort y estilo para tus entrenamientos más exigentes.',
    category: 'Men',
    size: '42',
    color: 'Negro',
    price: '120000.00',
    stock: 50,
    date_added: '2025-02-01T00:00:00.000Z',
    image_key: 'b2358d5a29c1e7e9cbf8b320495d1b45031a0d9b899e9fa2b458ea2c5f9a5e59',
    gender_id: 2,
    season_id: 2,
    age_id: 2,
    image_url: 'https://oiga-files.s3.us-east-1.amazonaws.com/b2358d5a29c1e7e9cbf8b320495d1b45031a0d9b899e9fa2b458ea2c5f9a5e59?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA46ZDE5FNF7BSL6PH%2F20250201%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250201T103654Z&X-Amz-Expires=60&X-Amz-Signature=d06ba6e7f87b034810d6b4692392dbe8012285457d0711cba7bdb5673f60676&X-Amz-SignedHeaders=host&x-id=GetObject'
  }
]

// const nonExistingId = async () => {
//   const [product] = await db('products')
//     .insert({
//       name: 'willremovethissoon',
//       description: 'Producto temporal',
//       category: 'Uncategorized',
//       size: 'M',
//       color: 'Gray',
//       price: '0.00',
//       stock: 1,
//       date_added: new Date().toISOString(),
//       image_key: 'temporaryimagekey123',
//       gender_id: 1,
//       season_id: 1,
//       age_id: 1,
//       image_url: 'https://placeholder.com/temporary-image-url'
//     })
//     .returning('id')

//   await db('products')
//     .where('id', product.id)
//     .del()

//   return product.id.toString()
// }

const productsInDb = async () => {
  const products = await db('products').select('*')
  return products
}


module.exports = {
  initialProducts, productsInDb
}