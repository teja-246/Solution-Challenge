import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { GoogleGenerativeAI } from "@google/generative-ai";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import os from "os";

dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

const transcribe = asyncHandler(async (req, res) => {
    const videoId = req.query.videoId;
    if (!videoId) return res.status(400).json({ error: "Missing videoId" });

    // Create temp files with unique names
    const tempDir = os.tmpdir();
    const cookiesPath = path.join(tempDir, `youtube-cookies-${Date.now()}.txt`);
    
    if (!process.env.YOUTUBE_COOKIES) {
        console.error("YOUTUBE_COOKIES environment variable is not set");
        return res.status(500).json({ error: "YouTube authentication not configured" });
    }
    
    try {
        await fs.promises.writeFile(cookiesPath, process.env.YOUTUBE_COOKIES, 'utf8');
        console.log(`Created cookies file at ${cookiesPath}`);
    } catch (err) {
        console.error("Error writing cookies file:", err);
        return res.status(500).json({ error: "Failed to setup authentication" });
    }

    const outputFilePattern = path.join(tempDir, `captions-${videoId}-${Date.now()}.%(ext)s`);
    
    // Add user-agent and referer to make the request look more like a browser
    const command = `yt-dlp --verbose --cookies "${cookiesPath}" --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36" --referer "https://www.youtube.com/" --write-auto-sub --sub-lang en --skip-download "https://www.youtube.com/watch?v=${videoId}" -o "${outputFilePattern}"`;
    
    console.log("Executing command:", command);
    
    exec(command, async (error, stdout, stderr) => {
        console.log("yt-dlp stdout:", stdout);
        
        if (error) {
            console.error("yt-dlp error:", stderr);
            return res.status(500).json({ error: "Failed to fetch captions: " + stderr.slice(0, 200) + "..." });
        }

        try {
            // Look for the caption files using glob pattern matching
            const glob = require('glob');
            const captionPattern = path.join(tempDir, `captions-${videoId}-*.en.{vtt,srt}`);
            
            glob(captionPattern, async (err, files) => {
                if (err || files.length === 0) {
                    console.error("No caption files found:", err || "Empty result");
                    return res.status(500).json({ error: "Captions not available for this video" });
                }
                
                const captionFile = files[0];
                console.log("Found caption file:", captionFile);
                
                try {
                    const data = await fs.promises.readFile(captionFile, "utf8");
                    const cleanedText = cleanWebVTT(data);
                    
                    // Clean up
                    try {
                        await fs.promises.unlink(captionFile);
                        await fs.promises.unlink(cookiesPath);
                    } catch (cleanupErr) {
                        console.warn("Failed to clean up files:", cleanupErr);
                    }
                    
                    res.json({ text: cleanedText });
                } catch (readErr) {
                    console.error("Error reading caption file:", readErr);
                    return res.status(500).json({ error: "Error processing captions" });
                }
            });
        } catch (processErr) {
            console.error("Error processing captions:", processErr);
            return res.status(500).json({ error: "Error processing captions" });
        }
    });
});

// Helper function to safely check if file exists
async function fileExists(filePath) {
    try {
        await fs.promises.access(filePath, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

const factCheck = asyncHandler(async (req, res) => {
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
});

const textAnalyzer = asyncHandler(async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: "Missing text" });

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
        const prompt = `Check if the following text contains misinformation, hate speech, sexual violence, etc. If any part is harmful, highlight the fake part and provide the correct information point wise: ${text}`;

        const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        const responseText = result.response.text();

        res.json({ factCheckedText: responseText });
    }
    catch (error) {
        console.error("Google Gemini API error:", error);
        res.status(500).json({ error: "Fact-checking failed" });
    }
});



export { transcribe, factCheck, textAnalyzer };