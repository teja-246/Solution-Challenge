document.getElementById("scanPage").addEventListener("click", () => {
    document.getElementById("status").innerText = "Scanning...";

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "startScan" }, (response) => {
            console.log(response?.status || "No response from content script.");
            document.getElementById("status").innerText = "Scan Complete!";
        });
    });
});
