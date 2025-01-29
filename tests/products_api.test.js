const { test, after, beforeEach } = require('node:test')
const supertest = require('supertest')
const app = require('../app')
const { db } = require('../utils/config')
const assert = require('assert')
const helper = require('./test_helpers')

const api = supertest(app)


beforeEach(async () => {
  await db('products').del()

  await db('products').insert(helper.initialProducts)
})

test('products are returned as json', async () => {
  await api
    .get('/products')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('there are two products', async () => {
  const response = await api.get('/products')

  assert.strictEqual(response.body.length, helper.initialProducts.length)
})

test('the first product is "Adidas UltraBoost 2025 Running Shoes"', async () => {
  const response = await api.get('/products')

  const contents = response.body.map(e => e.name)

  assert(contents.includes('Adidas UltraBoost 2025 Running Shoes'))
})

// test('a valid product can be added ', async () => {
//   const newProduct = {
//     id: 19,
//     name: 'Nike Total90 cleats',
//     description: 'A classic.',
//     category: 'Men',
//     size: '9',
//     color: 'Rojo',
//     price: '180000.00',
//     stock: 50,
//     date_added: '2025-02-01T00:00:00.000Z',
//     image_key: 'b2358d5a29c1e7e9cbf8b320495d1b45031a0d9b899e9fa2b458ea2c5f9a5e64',
//     gender_id: 1,
//     season_id: 3,
//     age_id: 2,
//     image_url: 'https://oiga-files.s3.us-east-1.amazonaws.com/b2358d5a29c1e7e9cbf8b320495d1b45031a0d9b899e9fa2b458ea2c5f9a5e59?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA46ZDE5FNF7BSL6PH%2F20250201%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250201T103654Z&X-Amz-Expires=60&X-Amz-Signature=d06ba6e7f87b034810d6b4692392dbe8012285457d0711cba7bdb5673f60676&X-Amz-SignedHeaders=host&x-id=GetObjecthttps://bootscentric.co.za/cdn/shop/files/33_5c555ffe-22d6-4735-9739-b591e2fe2846_720x.png?v=1727725631'
//   }

//   await api
//     .post('/products')
//     .send(newProduct)
//     .expect(201)
//     .expect('Content-Type', /application\/json/)

//   const response = await api.get('/products')

//   const contents = response.body.map(r => r.name)

//   assert.strictEqual(response.body.length, helper.initialProducts.length + 1)

//   assert(contents.includes('Nike Total90 cleats'))
// })

test('a specific product can be viewed', async () => {
  const prodcutsAtStart = await helper.productsInDb()

  const productToView = prodcutsAtStart[0]

  const resultProduct = await api
    .get(`/products/${productToView.id}`)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  console.log ('result to look', resultProduct.body)

  assert.deepStrictEqual(resultProduct.body, productToView)
})

// test('a note can be deleted', async () => {
//   const notesAtStart = await helper.notesInDb()
//   const noteToDelete = notesAtStart[0]


//   await api
//     .delete(`/api/notes/${noteToDelete.id}`)
//     .expect(204)

//   const notesAtEnd = await helper.notesInDb()

//   const contents = notesAtEnd.map(r => r.content)
//   assert(!contents.includes(noteToDelete.content))

//   assert.strictEqual(notesAtEnd.length, helper.initialNotes.length - 1)
// })

after(async () => {
  await db.destroy()
})