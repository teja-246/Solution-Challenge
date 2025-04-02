document.addEventListener('DOMContentLoaded', function() {
  // Load saved API key
  chrome.storage.local.get('GEMINI_API_KEY', function(data) {
    if (data.GEMINI_API_KEY && data.GEMINI_API_KEY !== 'AIzaSyBACoTuYiJYrlF4e5hhHCjVK5IrDjA5DB4') {
      document.getElementById('apiKey').value = data.GEMINI_API_KEY;
      document.getElementById('statusMessage').textContent = 'API key configured';
    } else {
      document.getElementById('statusMessage').textContent = 'Please enter your Gemini API key';
    }
  });
  
  // Save API key
  document.getElementById('saveKey').addEventListener('click', function() {
    const apiKey = document.getElementById('apiKey').value.trim();
    
    if (apiKey) {
      chrome.storage.local.set({ 'GEMINI_API_KEY': apiKey }, function() {
        document.getElementById('statusMessage').textContent = 'API key saved successfully!';
        // Wait a bit and change the message
        setTimeout(() => {
          document.getElementById('statusMessage').textContent = 'Ready to check videos';
        }, 2000);
      });
    } else {
      document.getElementById('statusMessage').textContent = 'Please enter a valid API key';
    }
  });
  
  // Check if we're on a YouTube video page
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const activeTab = tabs[0];
    if (activeTab && activeTab.url && activeTab.url.includes('youtube.com/watch')) {
      document.getElementById('statusMessage').textContent = 'Active on a YouTube video';
    }
  });
});