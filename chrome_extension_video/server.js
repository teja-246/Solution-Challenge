// Import required packages
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Error handling middleware
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to clean WebVTT format
const cleanWebVTT = (rawText) => {
  return rawText
    .replace(/<\d{2}:\d{2}:\d{2}\.\d{3}><c>/g, "")
    .replace(/<\/c>/g, "")
    .split("\n")
    .filter(line =>
      !line.startsWith("WEBVTT") &&
      !line.startsWith("Kind:") &&
      !line.startsWith("Language:") &&
      !line.match(/^\d+$/) &&
      !line.match(/\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}/) &&
      !line.includes("align:start") &&
      !line.includes("position:")
    )
    .join("\n")
    .trim();
};

// Route to transcribe YouTube video
app.get('/api/transcribe', asyncHandler(async (req, res) => {
  const videoId = req.query.videoId;
  if (!videoId) return res.status(400).json({ error: "Missing videoId" });

  const outputFilePattern = path.join(__dirname, "captions.%(ext)s");
  const command = `yt-dlp --write-auto-sub --sub-lang en --skip-download "https://www.youtube.com/watch?v=${videoId}" -o "${outputFilePattern}"`;

  exec(command, async (error, stdout, stderr) => {
    if (error) {
      console.error("yt-dlp error:", stderr);
      return res.status(500).json({ error: "Failed to fetch captions" });
    }

    // Check if captions were generated
    let captionFile;
    if (fs.existsSync(path.join(__dirname, "captions.en.vtt"))) {
      captionFile = path.join(__dirname, "captions.en.vtt");
    } else if (fs.existsSync(path.join(__dirname, "captions.en.srt"))) {
      captionFile = path.join(__dirname, "captions.en.srt");
    } else {
      console.error("Captions file not found");
      return res.status(500).json({ error: "Captions not available for this video" });
    }

    try {
      const data = await fs.promises.readFile(captionFile, "utf8");
      const cleanedText = cleanWebVTT(data);
      res.json({ text: cleanedText });
    } catch (readError) {
      console.error("Error reading captions:", readError);
      return res.status(500).json({ error: "Error processing captions" });
    } finally {
      try {
        await fs.promises.unlink(captionFile);
      } catch (err) {
        console.warn("Failed to delete caption file:", err);
      }
    }
  });
}));

// Route to fact-check text
app.post('/api/factCheck', asyncHandler(async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Missing text" });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
    const prompt = `Check if the following content contains misinformation. If any part is fake, highlight the fake part and provide the correct information: ${text}`;

    const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });

    // Safely extract response text
    const responseText = result.response.text();

    res.json({ factCheckedText: responseText });
  } catch (error) {
    console.error("Google Gemini API error:", error);
    res.status(500).json({ error: "Fact-checking failed", details: error.message });
  }
}));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});