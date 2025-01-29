const dotenv = require('dotenv')
dotenv.config()
const knex = require('knex')

const PORT = process.env.PORT

const DB_CONNECTION = process.env.NODE_ENV === 'test'
  ? {
    host: process.env.TEST_DB_HOST,
    user: process.env.TEST_DB_USER,
    password: process.env.TEST_DB_PASSWORD,
    database: process.env.TEST_DB_NAME,
    port: process.env.TEST_DB_PORT,
  }
  : {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 5432,
    ssl: { rejectUnauthorized: false }
  }


const knexConfig = {
  client: 'pg',
  connection: DB_CONNECTION,
}

const db = knex(knexConfig)

db.raw('SELECT 1+1 AS result')
  .then(() => {
    console.log('Conexión a base de datos exitosa')
  })
  .catch((err) => {
    console.error('Error de conexión:', err)
  })

module.exports = {
  PORT,
  knexConfig,
  db,
}