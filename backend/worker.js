require("dotenv").config(); // Load environment variables from .env file

const { createClient } = require("redis");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { uploadToS3 } = require("./services/queue"); // Import uploadToS3

const client = createClient({
  url: "redis://localhost:6379", // Ensure this matches your Redis server details
});

client.on("error", (err) => console.error("Redis Client Error", err));

client.connect();

const processImage = async (filename) => {
  try {
    const filePath = path.join(__dirname, "uploads", filename);

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Basic image processing using sharp
    const processedFilePath = path.join(__dirname, "processed", filename);
    await sharp(filePath)
      .resize(800, 600)
      .toFormat("jpeg")
      .toFile(processedFilePath);

    console.log(`Processed image: ${processedFilePath}`);

    // Read processed file content
    const fileContent = fs.readFileSync(processedFilePath);

    // Upload to S3
    await uploadToS3(filename, fileContent);

    console.log(`Uploaded ${filename} to S3`);
  } catch (error) {
    console.error(`Error processing image ${filename}: ${error.message}`);
  }
};

const main = async () => {
  while (true) {
    try {
      const filename = await client.rPop("imageQueue");
      if (filename) {
        await processImage(filename);
      } else {
        console.log("No more images to process, waiting...");
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds before checking again
      }
    } catch (error) {
      console.error(`Error in main loop: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds before retrying
    }
  }
};

main();
