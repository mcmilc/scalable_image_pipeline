// backend/services/queue.js
const { createClient } = require("redis");
const AWS = require("aws-sdk");
require("dotenv").config(); // Load environment variables from .env file

const client = createClient({
  url: "redis://localhost:6379", // Ensure this matches your Redis server details
});

client.on("error", (err) => console.error("Redis Client Error", err));

client.connect();

const addToQueue = async (file) => {
  await client.lPush("imageQueue", file);
};

const getFromQueue = async () => {
  return await client.rPop("imageQueue");
};

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const uploadToS3 = (filename, fileContent) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: filename,
    Body: fileContent,
  };

  return s3.upload(params).promise();
};

module.exports = { addToQueue, getFromQueue, uploadToS3 };
