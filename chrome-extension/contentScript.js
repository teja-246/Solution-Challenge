// Gemini API Content Detection Script
(function () {
    if (window.contentScriptInjected) return;
    window.contentScriptInjected = true;

    const GEMINI_API_KEY = "AIzaSyBACoTuYiJYrlF4e5hhHCjVK5IrDjA5DB4"; // Replace with your actual API key
    const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    // Request queue management
    const requestQueue = [];
    let isProcessingQueue = false;
    const REQUEST_INTERVAL = 4000; // 4 seconds to respect rate limits

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

    async function analyzeContentWithGemini(text) {
        return enqueueRequest(async () => {
            try {
                const response = await fetch(GEMINI_API_ENDPOINT, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: `Analyze this text for harmful content. Identify if it contains:
                                        - Misinformation
                                        - Hate Speech
                                        - Explicit Content
                                        - Violent Content
                                        Provide a summary: "${text}"`
                                    }
                                ]
                            }
                        ],
                        generationConfig: {
                            maxOutputTokens: 100,
                            temperature: 0.2
                        },
                        safetySettings: [
                            {
                                category: "HARM_CATEGORY_HATE_SPEECH",
                                threshold: "BLOCK_MEDIUM_AND_ABOVE"
                            },
                            {
                                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                                threshold: "BLOCK_MEDIUM_AND_ABOVE"
                            }
                        ]
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log("Full API Response:", data);

                // Extract text response correctly
                const analysisText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                return parseGeminiResponse(analysisText);
            } catch (error) {
                console.error("Gemini API Error:", error);
                return { harmful: false, categories: {} };
            }
        });
    }

    // Improved parsing of Gemini response
    function parseGeminiResponse(responseText) {
        const categories = {
            misinformation: /misinformation|false/i.test(responseText),
            hateSpeech: /hate speech|racist|offensive/i.test(responseText),
            explicitContent: /explicit|adult|sexual/i.test(responseText),
            violentContent: /violence|attack|harmful/i.test(responseText)
        };

        return {
            harmful: Object.values(categories).some(Boolean),
            categories
        };
    }

    async function scanPage() {
        console.log("Starting content scan...");
        const elementsToScan = document.querySelectorAll("p, span, div, h1, h2, h3, a");

        let detections = {
            misinformation: 0,
            hateSpeech: 0,
            explicitContent: 0,
            violentContent: 0,
            totalHarmfulElements: 0
        };

        for (const element of elementsToScan) {
            const text = element.textContent.trim();
            if (text.length < 10) continue; // Skip short texts

            try {
                const analysis = await analyzeContentWithGemini(text);

                if (analysis.harmful) {
                    element.style.backgroundColor = "rgba(255, 0, 0)";
                    element.style.border = "2px solid red";
                    element.style.color = "darkred";

                    Object.entries(analysis.categories).forEach(([category, isHarmful]) => {
                        if (isHarmful) detections[category]++;
                    });

                    detections.totalHarmfulElements++;

                    const harmfulCategories = Object.keys(analysis.categories)
                        .filter((category) => analysis.categories[category])
                        .join(", ");
                    element.setAttribute("title", `Harmful Content: ${harmfulCategories}`);
                }
            } catch (error) {
                console.error("Error scanning text:", error);
            }

            await new Promise((resolve) => setTimeout(resolve, 200)); // Rate limit
        }

        console.log("Scan complete:", detections);
        return detections;
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "startScan") {
            scanPage()
                .then((results) => sendResponse({ status: "Scan Complete", detections: results }))
                .catch((error) => sendResponse({ status: "Scan Failed", error: error.message }));

            return true; // Async response
        }
    });

    console.log("Gemini Content Scanner loaded");
})();
