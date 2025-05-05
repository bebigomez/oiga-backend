const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

// Variables de entorno
const accessKey = process.env.ACCESS_KEY
const secretAccessKey = process.env.SECRET_ACCESS_KEY
const r2Endpoint = process.env.SECRET_R2_ENDPOINT
const bucketName = process.env.BUCKET_NAME

// Cliente S3 configurado para Cloudflare R2 u otro endpoint personalizado
const s3Client = new S3Client({
  region: 'auto',
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
})

// Función reutilizable para obtener URLs firmadas
const getSignedImageUrls = async (imageKeys) => {
  if (!Array.isArray(imageKeys)) {
    try {
      imageKeys = JSON.parse(imageKeys)
    } catch (err) {
      console.warn('Error al parsear image_keys:', err)
      return []
    }
  }

  return await Promise.all(
    imageKeys.map((key) =>
      getSignedUrl(
        s3Client,
        new GetObjectCommand({ Bucket: bucketName, Key: key }),
        { expiresIn: 60 }
      )
    )
  )
}

module.exports = {
  s3Client,
  bucketName,
  getSignedImageUrls,
}
