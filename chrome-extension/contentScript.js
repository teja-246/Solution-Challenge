(function () {
    if (window.contentScriptInjected) return;
    window.contentScriptInjected = true;

    const GEMINI_API_KEY = "MyApiKey"; // Replace with your actual API key
    const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const requestQueue = [];
    let isProcessingQueue = false;
    const REQUEST_INTERVAL = 10000; // 10 seconds to respect rate limits

    function enqueueRequest(requestFunction) {
        return new Promise((resolve, reject) => {
            requestQueue.push({ requestFunction, resolve, reject });
            processQueue();
        });
    }

    function processQueue() {
        if (isProcessingQueue || requestQueue.length === 0) return;

        isProcessingQueue = true;
        const { requestFunction, resolve, reject } = requestQueue.shift();

        requestFunction()
            .then(resolve)
            .catch(reject)
            .finally(() => {
                isProcessingQueue = false;
                setTimeout(processQueue, REQUEST_INTERVAL);
            });
    }

    async function analyzeContentWithGemini(input) {
        const texts = Array.isArray(input) ? input : [input];
        return enqueueRequest(async () => {
            try {
                const response = await fetch(GEMINI_API_ENDPOINT, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ role: "user", parts: texts.map(text => ({ text })) }],
                        safetySettings: [
                            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
                        ],
                        generationConfig: { maxOutputTokens: 100, temperature: 0.2 }
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error("🔥 Gemini API Error:", JSON.stringify(errorData, null, 2));
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                if (!data?.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
                    console.error("❌ No valid candidates in API response:", JSON.stringify(data, null, 2));
                    return texts.map(() => ({ harmful: false, categories: {} }));
                }

                return data.candidates.map(candidate => {
                    if (!candidate?.content?.parts?.[0]?.text) {
                        console.warn("🚨 Candidate missing text:", JSON.stringify(candidate, null, 2));
                        return { harmful: false, categories: {} };
                    }
                    return parseGeminiResponse(candidate.content.parts[0].text);
                });
            } catch (error) {
                console.log("🔥 Full API Response:", JSON.stringify(data, null, 2));
                return texts.map(() => ({ harmful: false, categories: {} }));
            }
        });
    }

    function parseGeminiResponse(responseText) {
        const categories = {
            misinformation: /misinformation|false/i.test(responseText),
            hateSpeech: /hate speech|racist|offensive/i.test(responseText),
            explicitContent: /explicit|adult|sexual/i.test(responseText),
            violentContent: /violence|attack|harmful/i.test(responseText)
        };
        return { harmful: Object.values(categories).some(Boolean), categories };
    }

    async function scanPage() {
        console.log("🔍 Starting content scan...");
        const elementsToScan = document.querySelectorAll("p, span, div, h1, h2, h3, a");

        let detections = {
            misinformation: 0,
            hateSpeech: 0,
            explicitContent: 0,
            violentContent: 0,
            totalHarmfulElements: 0
        };

        const texts = [];
        const elementMap = new Map();

        for (const element of elementsToScan) {
            const text = element.textContent.trim();
            if (text.length < 10) continue;

            texts.push(text);
            elementMap.set(text, element);
        }

        if (texts.length === 0) return detections;

        try {
            const analysisResults = await analyzeContentWithGemini(texts);

            if (!analysisResults || analysisResults.length === 0) {
                console.error("❌ No valid analysis results received:", JSON.stringify(analysisResults, null, 2));
                return detections;
            }

            texts.forEach((text, index) => {
                const analysis = analysisResults[index];
                if (!analysis || typeof analysis !== "object") {
                    console.warn(`🚨 Skipping text at index ${index}: No valid analysis result.`);
                    return;
                }

                if (analysis.harmful) {
                    const element = elementMap.get(text);
                    element.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
                    element.style.border = "2px solid red";
                    element.style.color = "darkred";

                    Object.entries(analysis.categories).forEach(([category, isHarmful]) => {
                        if (isHarmful) detections[category]++;
                    });

                    detections.totalHarmfulElements++;
                    element.setAttribute("title", `⚠️ Harmful Content: ${Object.keys(analysis.categories).filter(cat => analysis.categories[cat]).join(", ")}`);
                }
            });
        } catch (error) {
            console.error("❌ Error scanning text:", error);
        }

        console.log("✅ Scan complete:", detections);
        return detections;
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "startScan") {
            scanPage()
                .then((results) => sendResponse({ status: "Scan Complete", detections: results }))
                .catch((error) => sendResponse({ status: "Scan Failed", error: error.message }));
            return true;
        }
    });

    console.log("🚀 Gemini Content Scanner loaded");
})();
