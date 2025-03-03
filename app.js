const express = require('express')
const cors = require('cors')
const { json } = express
const logger = require('./utils/logger')
const middleware = require('./utils/middleware')
const { PORT } = require('./utils/config')
const productsRouter = require('./controllers/products')

const app = express()

logger.info('connecting to', PORT)

app.use(cors())
app.use(json())
app.use(middleware.requestLogger)

app.get('/ping', (req, res) => {
  res.json('pong')
})

app.use('/products', productsRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app
