// const express = require('express')
// const { json } = express
const { db } = require('../utils/config')
// const cors = require('cors')
const multer = require('multer')
const { memoryStorage } = require('multer')
const sharp = require('sharp')
const crypto = require('crypto')

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

// const app = express()

// app.use(cors())

// app.use(json())

const productsRouter = require('express').Router()

const storage = memoryStorage()
const upload = multer({ storage: storage })

const generateFileName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString('hex')

const bucketName = process.env.BUCKET_NAME
const bucketRegion = process.env.BUCKET_REGION
const accessKey = process.env.ACCESS_KEY
const secretAccessKey = process.env.SECRET_ACCESS_KEY
const r2Endpoint = process.env.SECRET_R2_ENDPOINT

const s3Client = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
  endpoint: r2Endpoint
})

productsRouter.get('/', async (req, res) => {
  try {
    let query = db('products')
      .select(
        'products.*',
        'conditions.name as condition_name'
      )
      .leftJoin('conditions', 'products.condition_id', 'conditions.id')

    const products = await query

    // Generar la URL firmada para cada imagen de cada producto
    for (let product of products) {
      if (product.image_keys) {
        // Verificamos si image_keys es un array
        let imageKeys = []

        try {
          // Si image_keys ya es un array (en formato JSON), lo asignamos directamente
          imageKeys = Array.isArray(product.image_keys) ? product.image_keys : JSON.parse(product.image_keys)
        } catch (error) {
          // Si ocurre un error al parsear, lo manejamos
          console.warn(`Error al parsear image_keys para el producto ${product.id}:`, error)
          continue // Pasamos al siguiente producto si no es un JSON válido
        }

        // Generamos la URL firmada para cada imagen
        product.imageUrls = await Promise.all(
          imageKeys.map(async (imageKey) => {
            return await getSignedUrl(
              s3Client,
              new GetObjectCommand({
                Bucket: bucketName,
                Key: imageKey,
              }),
              { expiresIn: 60 } // 60 segundos
            )
          })
        )
      }
    }

    res.status(200).json(products)
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ message: 'Error al obtener los productos' })
  }
})


productsRouter.get('/:id', async (req, res) => {
  const { id } = req.params
  try {
    // const product = await db('products').where({ id }).first()

    const product = await db('products')
      .select(
        'products.*',
        'conditions.name as condition_name',
      )
      .leftJoin('conditions', 'products.condition_id', 'conditions.id')
      .where('products.id', id)
      .first()

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' })
    }

    // Verificar si el producto tiene claves de imágenes
    if (product.image_keys) {
      let imageKeys = []

      try {
        // Si image_keys ya es un array (en formato JSON), lo asignamos directamente
        imageKeys = Array.isArray(product.image_keys) ? product.image_keys : JSON.parse(product.image_keys)
      } catch (error) {
        console.warn(`Error al parsear image_keys para el producto ${product.id}:`, error)
        return res.status(500).json({ message: 'Error al procesar las claves de imagen' })
      }

      // Generamos las URL firmadas para cada imagen
      product.imageUrls = await Promise.all(
        imageKeys.map(async (imageKey) => {
          return await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: bucketName,
              Key: imageKey,
            }),
            { expiresIn: 120 } // 120 segundos de validez
          )
        })
      )
    }

    // Devuelve el producto con las URLs de las imágenes
    res.status(200).json(product)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al obtener el producto' })
  }
})

productsRouter.post('/', upload.array('images'), async (req, res) => {
  const {
    name,
    price,
    description,
    size,
    gender,
    age,
    type,
    style,
    season,
    condition,
  } = req.body

  const files = req.files

  if (!files || files.length === 0) {
    return res
      .status(400)
      .json({ message: 'Se deben subir al menos una imagen.' })
  }

  const imageKeys = []

  for (const file of files) {
    const fileBuffer = await sharp(file.buffer).webp().toBuffer()
    const fileName = generateFileName()

    const uploadParams = {
      Bucket: bucketName,
      Body: fileBuffer,
      Key: fileName,
      ContentType: file.mimetype,
    }

    await s3Client.send(new PutObjectCommand(uploadParams))

    imageKeys.push(fileName)
  }

  const [id] = await db('products')
    .insert({
      name,
      price,
      description,
      size,
      gender_id: gender,
      age_id: age,
      type,
      style_id: style,
      season_id: season,
      condition_id: condition,
      image_keys: JSON.stringify(imageKeys), // Guardamos las claves de las imágenes
    })
    .returning('id')

  res.status(201).json({ id, message: 'Producto agregado con éxito' })
})

module.exports = productsRouter
