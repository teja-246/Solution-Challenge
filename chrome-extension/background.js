chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startScan") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) {
                console.error("No active tab found.");
                sendResponse({ status: "Error", message: "No active tab found" });
                return;
            }

            const activeTab = tabs[0].id;

            chrome.scripting.executeScript(
                {
                    target: { tabId: activeTab },
                    files: ["contentScript.js"]
                },
                () => {
                    if (chrome.runtime.lastError) {
                        console.error("Error injecting content script:", chrome.runtime.lastError);
                        sendResponse({ status: "Error", message: chrome.runtime.lastError.message });
                        return;
                    }
            
                    // Use setTimeout to wait before sending the message
                    setTimeout(() => {
                        chrome.tabs.sendMessage(activeTab, { action: "startScan" }, (response) => {
                            if (chrome.runtime.lastError) {
                                console.error("Error sending message to content script:", chrome.runtime.lastError);
                                sendResponse({ status: "Error", message: chrome.runtime.lastError.message });
                                return;
                            }
                            sendResponse(response);
                        });
                    }, 100); // Small delay to ensure content script is fully loaded
                }
            );
            
        });

        return true; // Keep sendResponse valid for async operations
    }
});
