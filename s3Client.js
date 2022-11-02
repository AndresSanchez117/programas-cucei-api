require('dotenv').config()

const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3")
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")

// s3 client
const s3 = new S3Client({ region: process.env.AWS_REGION })

exports.upload = async (file, imgKey) => {
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: imgKey,
    Body: file.buffer,
    ContentType: file.mimetype
  }

  const command = new PutObjectCommand(params)
  await s3.send(command)
}

exports.getImgURL = async (imgKey) => {
  const getObjectParams = {
    Bucket: process.env.BUCKET_NAME,
    Key: imgKey
  }

  const command = new GetObjectCommand(getObjectParams)
  const imageUrl = await getSignedUrl(s3, command, { expiresIn: 7200 })

  return imageUrl
}