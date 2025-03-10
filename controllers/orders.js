const ordersRouter = require('express').Router()
const { db } = require('../utils/config')


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

    // 3. Responder al cliente con el ID del pedido
    res.status(201).json({ message: 'Order created successfully', order_id })
  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({ message: 'Failed to create order' })
  }
})



module.exports = ordersRouter
