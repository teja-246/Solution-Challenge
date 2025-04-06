import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { GoogleGenerativeAI } from "@google/generative-ai";
import { exec } from "child_process"; 
import fs from "fs"; 
import path from "path";
import { fileURLToPath } from "url"; 
import dotenv from "dotenv";

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

    const cookiesPath = path.join(__dirname, "cookies.txt");
    const outputFilePattern = path.join(__dirname, "captions_%(id)s.%(ext)s");
const command = `yt-dlp --cookies "${cookiesPath}" --write-auto-sub --sub-lang en --skip-download "https://www.youtube.com/watch?v=${videoId}" -o "${outputFilePattern}"`;
// yt-dlp --cookies "${cookiesPath}" --write-auto-sub --sub-lang en --skip-download "https://www.youtube.com/watch?v=${videoId}" -o "${outputFilePattern}"
exec(command, async (error, stdout, stderr) => {
    if (error) {
        console.error("yt-dlp error:", stderr);
        return res.status(500).json({ error: "Failed to fetch captions" });
    }

    const vttPath = path.join(__dirname, `captions_${videoId}.en.vtt`);
    const srtPath = path.join(__dirname, `captions_${videoId}.en.srt`);

    let captionFile;
    if (fs.existsSync(vttPath)) {
        captionFile = vttPath;
    } else if (fs.existsSync(srtPath)) {
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
        try {
            await fs.promises.unlink(captionFile);
        } catch (err) {
            console.warn("Failed to delete caption file:", err);
        }
    }
});





    // const outputFilePattern = path.join(__dirname, "captions.%(ext)s");
    // // const command = `yt-dlp --cookies cookies.txt -j "https://www.youtube.com/watch?v=${videoId}"`;
    // const command = `yt-dlp --write-auto-sub --sub-lang en --skip-download --cookies cookies.txt -j "https://www.youtube.com/watch?v=${videoId}" -o "${outputFilePattern}"`;

    // exec(command, async (error, stdout, stderr) => {
    //     if (error) {
    //         console.error("yt-dlp error:", stderr);
    //         return res.status(500).json({ error: "Failed to fetch captions" });
    //     }

    //     // Check if captions were generated
    //     let captionFile;
    //     if (fs.existsSync(path.join(__dirname, "captions.en.vtt"))) {  // <-- FIXED
    //         captionFile = path.join(__dirname, "captions.en.vtt");
    //     } else if (fs.existsSync(path.join(__dirname, "captions.en.srt"))) {
    //         captionFile = path.join(__dirname, "captions.en.srt");
    //     } else {
    //         console.error("Captions file not found");
    //         return res.status(500).json({ error: "Captions not available for this video" });
    //     }

    //     try {
    //         const data = await fs.promises.readFile(captionFile, "utf8");
    //         const cleanedText = cleanWebVTT(data);
    //         res.json({ text: cleanedText });
    //     } catch (readError) {
    //         console.error("Error reading captions:", readError);
    //         return res.status(500).json({ error: "Error processing captions" });
    //     } finally {
    //         try {
    //             await fs.promises.unlink(captionFile);
    //         } catch (err) {
    //             console.warn("Failed to delete caption file:", err);
    //         }
    //     }
    // });
});

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