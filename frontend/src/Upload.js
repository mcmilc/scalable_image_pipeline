import React, { useState } from "react";
import axios from "axios";

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setMessage("Please select files or a folder to upload.");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const response = await axios.post(
        "http://localhost:5000/api/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setMessage("Files uploaded successfully!");
    } catch (error) {
      console.error("Error uploading files:", error);
      setMessage(
        `File upload failed: ${
          error.response ? error.response.data.error : error.message
        }`
      );
    }
  };

  return (
    <div>
      <input
        type="file"
        multiple
        webkitdirectory="true"
        onChange={handleFileChange}
      />
      <button onClick={handleUpload}>Upload</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Upload;
