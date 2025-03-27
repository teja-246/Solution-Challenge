chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startScan") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) {
                console.error("No active tab found.");
                sendResponse({ status: "Error", message: "No active tab found" });
                return;
            }

            const activeTab = tabs[0].id;

            chrome.tabs.sendMessage(activeTab, { action: "startScan" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error sending message to content script:", chrome.runtime.lastError);
                    sendResponse({ status: "Error", message: chrome.runtime.lastError.message });
                    return;
                }

                sendResponse(response);
            });
        });

        return true; // Keep sendResponse valid for async operations
    }
});
