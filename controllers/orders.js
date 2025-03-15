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
    );

    res.status(201).json({ message: 'Order created successfully', order_id })
  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({ message: 'Failed to create order' })
  }
})



module.exports = ordersRouter
