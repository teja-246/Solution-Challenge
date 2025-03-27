// Gemini API Content Detection Script
(function() {
    // Prevent multiple executions
    if (window.contentScriptInjected) return;
    window.contentScriptInjected = true;

    // Gemini API Configuration
    const GEMINI_API_KEY = "AIzaSyBACoTuYiJYrlF4e5hhHCjVK5IrDjA5DB4"; // Replace with your actual API key
    const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

    // Function to call Gemini API for content analysis
    async function analyzeContentWithGemini(text) {
        try {
            const response = await fetch(GEMINI_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Carefully analyze the following text for potentially harmful content. 
                                   Categorize and identify if the text contains:
                                   1. Misinformation
                                   2. Hate Speech
                                   3. Explicit Content
                                   4. Violent Content

                                   Provide a concise analysis. Text to analyze:
                                   "${text}"`
                        }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 100,
                        temperature: 0.2
                    },
                    safetySettings: [
                        {
                            category: 'HARM_CATEGORY_HATE_SPEECH',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                        },
                        {
                            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            console.log('Full Response:', data);

            // Extract analysis from Gemini's response
            const analysisText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            return parseGeminiResponse(analysisText);
        } catch (error) {
            console.error('Gemini API Error:', error);
            return null;
        }
    }

    // Parse Gemini's response into a structured format
    function parseGeminiResponse(responseText) {
        const categories = {
            misinformation: responseText.toLowerCase().includes('misinformation'),
            hateSpeech: responseText.toLowerCase().includes('hate speech'),
            explicitContent: responseText.toLowerCase().includes('explicit content'),
            violentContent: responseText.toLowerCase().includes('violent content')
        };

        return {
            harmful: Object.values(categories).some(Boolean),
            categories: categories
        };
    }

    // Scan page and mark harmful content
    async function scanPage() {
        console.log("Gemini-powered content scanning started");
        const elementsToScan = document.querySelectorAll('p, span, div, h1, h2, h3, a');
        
        let detections = {
            misinformation: 0,
            hateSpeech: 0,
            explicitContent: 0,
            violentContent: 0,
            totalHarmfulElements: 0
        };

        // Process elements with rate limiting
        for (const element of elementsToScan) {
            const text = element.textContent.trim();
            
            // Skip very short texts
            if (text.length < 10) continue;

            try {
                const analysis = await analyzeContentWithGemini(text);
                
                if (analysis && analysis.harmful) {
                    // Highlight harmful content
                    element.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
                    element.style.border = '2px solid red';
                    element.style.color = 'darkred';

                    // Update detection counts
                    Object.entries(analysis.categories).forEach(([category, isHarmful]) => {
                        if (isHarmful) {
                            detections[category]++;
                        }
                    });

                    detections.totalHarmfulElements++;

                    // Add tooltip with details
                    const harmfulCategories = Object.entries(analysis.categories)
                        .filter(([_, isHarmful]) => isHarmful)
                        .map(([category, _]) => category)
                        .join(', ');
                    
                    element.setAttribute('title', `Harmful Content Detected: ${harmfulCategories}`);
                }
            } catch (error) {
                console.error('Scanning error:', error);
            }

            // Simple rate limiting to avoid overwhelming API
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log("Scan complete", detections);
        return detections;
    }

    // Listen for scan trigger
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "startScan") {
            scanPage().then(results => {
                sendResponse({ 
                    status: "Scan Complete", 
                    detections: results 
                });
            }).catch(error => {
                sendResponse({ 
                    status: "Scan Failed", 
                    error: error.message 
                });
            });
            return true; // Indicates async response
        }
    });

    console.log("Gemini Content Detection Script Loaded");
})();