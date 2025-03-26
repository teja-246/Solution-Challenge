// Wrap in IIFE to prevent global scope pollution
(function() {
    // Prevent multiple executions
    if (window.contentScriptInjected) return;
    window.contentScriptInjected = true;

    console.log("Content script loaded");

    // Harmful keywords for detection
    const harmfulKeywords = [
        "fake news", "misinformation", "hate speech", 
        "violence", "explicit", "conspiracy"
    ];

    function scanPage() {
        console.log("Scanning page...");
        const elements = document.querySelectorAll('p, div, span, h1, h2, h3');
        let detections = { 
            harmfulContent: 0,
            matchedElements: []
        };

        elements.forEach(element => {
            const text = element.textContent.toLowerCase();
            const matches = harmfulKeywords.filter(keyword => 
                text.includes(keyword)
            );

            if (matches.length > 0) {
                // Highlight harmful content
                element.style.backgroundColor = 'yellow';
                element.style.color = 'red';
                
                detections.harmfulContent += matches.length;
                detections.matchedElements.push({
                    text: element.textContent,
                    keywords: matches
                });
            }
        });

        console.log("Scan results:", detections);
        return detections;
    }

    // Listen for scan requests
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log("Content script received message:", request);
        
        if (request.action === "startScan") {
            try {
                const results = scanPage();
                sendResponse({ 
                    status: "success", 
                    detections: results 
                });
            } catch (error) {
                console.error("Scan error:", error);
                sendResponse({ 
                    status: "error", 
                    message: error.toString() 
                });
            }
        }
        return true; // Indicate async response
    });

    console.log("Content script setup complete");
})();