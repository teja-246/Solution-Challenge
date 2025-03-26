// Prevent multiple executions
if (!window.hasRun) {
    window.hasRun = true;

    const harmfulKeywords = ["fake news", "violence", "explicit", "misinformation", "hate speech"];

    function scanPage() {
        console.log("Scanning started...");
        // document.body.style.border = "5px solid red"; // Indicate scanning

        const elements = document.querySelectorAll("p, span, div, a");
        let found = false;

        elements.forEach(element => {
            harmfulKeywords.forEach(keyword => {
                if (element.textContent.toLowerCase().includes(keyword)) {
                    element.style.backgroundColor = "yellow";
                    element.style.color = "red";
                    found = true;
                }
            });
        });

        if (found) {
            console.log("Harmful content detected!");
        } else {
            console.log("No harmful content found.");
        }

        // Notify popup.js that scanning is done
        chrome.runtime.sendMessage({ action: "scanComplete" });
    }

    // Listen for scan trigger from popup.js
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "startScan") {
            scanPage();
            sendResponse({ status: "Scanning started" });
        }
    });
}
