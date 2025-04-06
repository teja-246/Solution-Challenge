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
import { fileURLToPath } from "url";

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

    // Create a cookies directory that's writable in the Render environment
    const tempDir = os.tmpdir();
    const cookiesPath = path.join(tempDir, "youtube-cookies.txt");

    // Write cookies from environment variable to file
    // Make sure to add this as an environment variable in Render dashboard
    try {
        await fs.promises.writeFile(cookiesPath, process.env.YOUTUBE_COOKIES || '', 'utf8');
    } catch (err) {
        console.error("Error writing cookies file:", err);
        return res.status(500).json({ error: "Failed to setup authentication" });
    }

    const outputFilePattern = path.join(tempDir, `captions_${videoId}.%(ext)s`);

    // Use double quotes around paths for Windows compatibility
    const command = `yt-dlp --cookies "${cookiesPath}" --write-auto-sub --sub-lang en --skip-download "https://www.youtube.com/watch?v=${videoId}" -o "${outputFilePattern}"`;

    exec(command, async (error, stdout, stderr) => {
        if (error) {
            console.error("yt-dlp error:", stderr);
            return res.status(500).json({ error: "Failed to fetch captions" });
        }

        const vttPath = path.join(tempDir, `captions_${videoId}.en.vtt`);
        const srtPath = path.join(tempDir, `captions_${videoId}.en.srt`);

        let captionFile;
        if (await fileExists(vttPath)) {
            captionFile = vttPath;
        } else if (await fileExists(srtPath)) {
            captionFile = srtPath;
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
            // Clean up temporary files
            try {
                if (await fileExists(captionFile)) {
                    await fs.promises.unlink(captionFile);
                }
                if (await fileExists(cookiesPath)) {
                    await fs.promises.unlink(cookiesPath);
                }
            } catch (err) {
                console.warn("Failed to delete temporary files:", err);
            }
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