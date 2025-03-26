chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startScan") {
        // Forward scan request to active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                try {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "startScan" }, (response) => {
                        // Relay response back to popup
                        sendResponse(response);
                    });
                } catch (error) {
                    console.error("Background script error:", error);
                    sendResponse({ status: "Error", message: error.toString() });
                }
            }
        });
        return true; // Indicates async response
    }
});