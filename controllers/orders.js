const { db } = require('../utils/config')
const axios = require('axios')
const ordersRouter = require('express').Router()

const TRELLO_API_BASE_URL = 'https://api.trello.com/1'
const TRELLO_API_KEY = process.env.TRELLO_API_KEY
const TRELLO_API_TOKEN = process.env.TRELLO_API_TOKEN
const TRELLO_TODO_LIST_ID = process.env.TRELLO_TODO_LIST_ID

const trelloAxios = axios.create({
  baseURL: TRELLO_API_BASE_URL,
  params: {
    key: TRELLO_API_KEY,
    token: TRELLO_API_TOKEN,
  },
})

ordersRouter.get('/', async (req, res) => {
  try {
    const orders = await db('orders').select('*')

    if (orders.length === 0) {
      return res.status(404).json({ message: 'No orders found' })
    }

    res.status(200).json({ orders })
  } catch (error) {
    console.error('Error fetching orders:', error)
    res.status(500).json({ message: 'Failed to fetch orders' })
  }
})

const { getSignedImageUrls } = require('../utils/s3')

ordersRouter.get('/:id', async (req, res) => {
  const { id } = req.params

  try {
    const order = await db('orders').where('id', id).first()

    if (!order) {
      return res.status(404).json({ message: `Order with ID ${id} not found` })
    }

    const products = await db('order_products')
      .where('order_products.order_id', id)
      .join('products', 'order_products.product_id', 'products.id')
      .select(
        'products.id as product_id',
        'products.name',
        'products.description',
        'products.image_keys',
        'order_products.price as ordered_price',
        'order_products.quantity'
      )

    const productsWithSignedUrls = await Promise.all(
      products.map(async (product) => {
        const imageUrls = await getSignedImageUrls(product.image_keys)
        return { ...product, imageUrls }
      })
    )

    res.status(200).json({ order, products: productsWithSignedUrls })
  } catch (error) {
    console.error('Error fetching order with details:', error)
    res.status(500).json({ message: 'Failed to fetch order' })
  }
})



async function createCard(listId, cardName, cardDesc) {
  try {
    const response = await trelloAxios.post('/cards', {
      idList: listId,
      name: cardName,
      desc: cardDesc,
    })
    console.log('Card created successfully:', response.data)
    return response.data
  } catch (error) {
    console.error('Error creating card:', error.response.data)
    throw new Error('Failed to create card in Trello')
  }
}

ordersRouter.post('/', async (req, res) => {
  const { total_price, customer_name, customer_last_name, customer_phone, items } = req.body

  try {
    // 1. Crear el pedido en la tabla `orders`
    const [order] = await db('orders')
      .insert({
        total_price,
        status: 'pending',
        customer_name,
        customer_last_name,
        customer_phone,
        created_at: db.fn.now()
      })
      .returning('id')

    const order_id = order.id // Obtener el ID del pedido recién creado

    // 2. Insertar los productos en la tabla `order_products`
    const insertProductsPromises = items.map(item => {
      return db('order_products')
        .insert({
          order_id: order_id,  // ID del pedido recién creado
          product_id: item.id,
          price: item.price,
          quantity: item.quantity || 1,  // Si no se pasa cantidad, usamos 1 por defecto
          created_at: db.fn.now()
        })
    })

    await Promise.all(insertProductsPromises) // Esperar a que todos los productos se inserten

    const productIdsDescription = items
      .map(item => `Product ID: ${item.id} | Nombre: ${item.name}`)
      .join('\n')

    const cardDescription =
      'Cliente: ' + customer_name + ' ' + customer_last_name + '\n' +
      'Teléfono: ' + customer_phone + '\n' +
      'Precio total: $' + total_price + '\n\n' +
      'Detalles del pedido:\n' +
      productIdsDescription

    await createCard(
      TRELLO_TODO_LIST_ID,
      process.env.NODE_ENV === 'development'
        ? `[DEVELOPMENT] Nueva orden: ${order_id}`
        : `Nueva orden: ${order_id}`,
      cardDescription
    )

    res.status(201).json({ message: 'Order created successfully', order_id })
  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({ message: 'Failed to create order' })
  }
})



module.exports = ordersRouter
