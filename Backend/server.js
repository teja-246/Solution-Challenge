const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 5000;
const genAI = new GoogleGenerativeAI("add key");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.get("/transcribe", async (req, res) => {
    const videoId = req.query.videoId;
    if (!videoId) return res.status(400).json({ error: "Missing videoId" });

    const captionFile = path.join(__dirname, "captions.en.vtt");
    const command = `yt-dlp --write-auto-sub --sub-lang en --skip-download "https://www.youtube.com/watch?v=${videoId}" -o "captions.%(ext)s"`;

    exec(command, async (error, stdout, stderr) => {
        if (error) {
            console.error("yt-dlp error:", stderr);
            return res.status(500).json({ error: "Failed to fetch captions" });
        }

        try {
            const data = await fs.readFile(captionFile, "utf8");
            const cleanedText = cleanWebVTT(data);
            res.json({ text: cleanedText });
        } catch (readError) {
            console.error("Error reading captions:", readError);
            return res.status(500).json({ error: "Caption file not found" });
        } finally {
            
            fs.unlink(captionFile).catch(err => console.warn("Failed to delete caption file:", err));
        }
    });
});


app.post("/fact-check", async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: "Missing text" });

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" }); 
        const prompt = `Check if the following content contains misinformation. If any part is fake, highlight the fake part and provide the correct information: ${text}`;

        const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        const responseText = result.response.text();

        res.json({ factCheckedText: responseText });
    } catch (error) {
        console.error("Google Gemini API error:", error);
        res.status(500).json({ error: "Fact-checking failed" });
    }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
