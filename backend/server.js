require("dotenv").config(); // Load environment variables from .env file

const express = require("express");
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const { addToQueue } = require("./services/queue.js"); // Import addToQueue

const app = express();
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use(cors());

app.post("/api/upload", (req, res) => {
  const form = new formidable.IncomingForm({ multiples: true });
  form.uploadDir = uploadDir;
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "Failed to upload files" });
    }

    // Log the files object to inspect its structure
    console.log("Files:", files);

    // Handle multiple files
    const fileArray = files.files;

    if (!fileArray || fileArray.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const processedFiles = [];

    for (let file of fileArray) {
      const filename = file.newFilename || file.originalFilename || file.name;
      if (typeof filename !== "string") {
        return res.status(500).json({
          error: `Invalid file name. Type: ${typeof filename}, Value: ${JSON.stringify(
            filename
          )}`,
        });
      }

      const filePath = path.join(uploadDir, filename);

      // Move the file to the desired directory
      fs.renameSync(file.filepath, filePath);

      // Add file to queue
      await addToQueue(filename);
      processedFiles.push(filename);
    }

    return res.status(200).json({
      message: "Files uploaded and queued successfully",
      files: processedFiles,
    });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
