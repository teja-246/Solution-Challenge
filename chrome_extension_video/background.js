// Background script to handle API calls and communication

// Store API key securely (in production, you'd use a better method)
chrome.storage.local.set({ "GEMINI_API_KEY": "AIzaSyBACoTuYiJYrlF4e5hhHCjVK5IrDjA5DB4" });

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getVideoId") {
    const videoId = extractVideoId(message.url);
    sendResponse({ videoId: videoId });
  } else if (message.action === "fetchCaptions") {
    fetchCaptions(message.videoId)
      .then(captions => {
        if (captions) {
          sendResponse({ success: true, captions: captions });
        } else {
          sendResponse({ success: false, error: "No captions available" });
        }
      })
      .catch(error => {
        console.error("Error fetching captions:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Required for async sendResponse
  } else if (message.action === "factCheck") {
    factCheckText(message.text)
      .then(result => {
        sendResponse({ success: true, result: result });
      })
      .catch(error => {
        console.error("Error fact-checking:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Required for async sendResponse
  }
});

// Extract YouTube video ID from URL
function extractVideoId(url) {
  const urlObj = new URL(url);
  const searchParams = new URLSearchParams(urlObj.search);
  return searchParams.get("v");
}

// Function to fetch captions using your own backend server
async function fetchCaptions(videoId) {
  try {
    const response = await fetch(`https://your-backend-server.com/api/transcribe?videoId=${videoId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch captions");
    }
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Error fetching captions:", error);
    throw error;
  }
}

// Function to send text to Gemini AI for fact-checking
async function factCheckText(text) {
  try {
    const apiKey = await new Promise((resolve) => {
      chrome.storage.local.get("GEMINI_API_KEY", (data) => {
        resolve(data.GEMINI_API_KEY);
      });
    });
    
    const response = await fetch("https://your-backend-server.com/api/factCheck", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: text })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Fact-checking failed");
    }
    
    const data = await response.json();
    return data.factCheckedText;
  } catch (error) {
    console.error("Error in fact checking:", error);
    throw error;
  }
}