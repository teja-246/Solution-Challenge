let currentVideoId = null;
let captions = null;
let isFetchingCaptions = false;
let isFactChecking = false;
let misinformationFound = false;
let misinformationList = [];
let captionChunks = [];

// Initialize extension when page loads
window.addEventListener('load', initializeExtension);
window.addEventListener('yt-navigate-finish', initializeExtension);

function initializeExtension() {
  // Only run on video pages
  if (window.location.pathname !== '/watch') {
    return;
  }
  
  // Reset state
  misinformationFound = false;
  misinformationList = [];
  captionChunks = [];
  
  // Get current video ID
  chrome.runtime.sendMessage(
    { action: "getVideoId", url: window.location.href },
    (response) => {
      if (response && response.videoId && response.videoId !== currentVideoId) {
        currentVideoId = response.videoId;
        fetchCaptionsForVideo(currentVideoId);
      }
    }
  );
  
  // Add UI elements
  addFactCheckUI();
}

function addFactCheckUI() {
  // Make sure we don't add duplicate elements
  if (document.getElementById('fact-check-container')) {
    return;
  }
  
  // Create container for fact check results
  const container = document.createElement('div');
  container.id = 'fact-check-container';
  container.style = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px;
    border-radius: 5px;
    z-index: 9999;
    max-width: 300px;
    display: none;
  `;
  
  // Create heading
  const heading = document.createElement('h3');
  heading.textContent = 'Misinformation Detected';
  heading.style = 'margin: 0 0 10px; color: #ff4444;';
  container.appendChild(heading);
  
  // Create content area
  const content = document.createElement('div');
  content.id = 'fact-check-content';
  container.appendChild(content);
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style = 'background: #555; color: white; border: none; padding: 5px 10px; margin-top: 10px; cursor: pointer;';
  closeButton.onclick = () => { container.style.display = 'none'; };
  container.appendChild(closeButton);
  
  // Add to page
  document.body.appendChild(container);
  
  // Add status indicator
  const statusIndicator = document.createElement('div');
  statusIndicator.id = 'fact-check-status';
  statusIndicator.style = `
    position: absolute;
    bottom: 60px;
    right: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    z-index: 9999;
    font-size: 12px;
  `;
  statusIndicator.textContent = 'Fact-checking: Waiting for captions...';
  document.body.appendChild(statusIndicator);
}

async function fetchCaptionsForVideo(videoId) {
  if (isFetchingCaptions) return;
  isFetchingCaptions = true;
  
  updateStatusIndicator('Fetching captions...');
  
  chrome.runtime.sendMessage(
    { action: "fetchCaptions", videoId: videoId }, 
    (response) => {
      isFetchingCaptions = false;
      
      if (response && response.success) {
        captions = response.captions;
        updateStatusIndicator('Processing captions...');
        processCaptions(captions);
      } else {
        updateStatusIndicator('Error: ' + (response?.error || 'Failed to fetch captions'));
        setTimeout(() => {
          hideStatusIndicator();
        }, 5000);
      }
    }
  );
}

function processCaptions(captionsText) {
  if (!captionsText) return;
  
  // Split into chunks of approximately 100 words
  const words = captionsText.split(/\s+/);
  captionChunks = [];
  
  for (let i = 0; i < words.length; i += 100) {
    const chunk = words.slice(i, i + 100).join(' ');
    captionChunks.push(chunk);
  }
  
  updateStatusIndicator(`Fact-checking: 0/${captionChunks.length} chunks`);
  
  // Start fact-checking process
  factCheckNextChunk(0);
}

function factCheckNextChunk(index) {
  if (index >= captionChunks.length) {
    // We're done checking all chunks
    if (misinformationFound) {
      updateStatusIndicator('Fact-checking complete: Misinformation found!');
      showMisinformationAlert();
    } else {
      updateStatusIndicator('Fact-checking complete: No issues found');
      setTimeout(() => {
        hideStatusIndicator();
      }, 5000);
    }
    return;
  }
  
  updateStatusIndicator(`Fact-checking: ${index + 1}/${captionChunks.length} chunks`);
  
  const chunk = captionChunks[index];
  
  chrome.runtime.sendMessage(
    { action: "factCheck", text: chunk },
    (response) => {
      if (response && response.success) {
        const result = response.result;
        
        // Check if misinformation was found
        if (result.toLowerCase().includes("misinformation") || 
            result.toLowerCase().includes("fake") ||
            result.toLowerCase().includes("incorrect") || 
            result.toLowerCase().includes("false")) {
          
          misinformationFound = true;
          misinformationList.push({
            chunk: chunk,
            analysis: result
          });
        }
      }
      
      // Process next chunk after a slight delay (to control API rate)
      setTimeout(() => {
        factCheckNextChunk(index + 1);
      }, 1000); // Process one chunk per second
    }
  );
}

function showMisinformationAlert() {
  const container = document.getElementById('fact-check-container');
  const content = document.getElementById('fact-check-content');
  
  // Clear previous content
  content.innerHTML = '';
  
  // Add each misinformation item
  misinformationList.forEach((item, index) => {
    const itemEl = document.createElement('div');
    itemEl.style = 'margin-bottom: 15px; border-bottom: 1px solid #444; padding-bottom: 10px;';
    
    const indexEl = document.createElement('strong');
    indexEl.textContent = `Issue ${index + 1}:`;
    indexEl.style = 'color: #ff4444;';
    itemEl.appendChild(indexEl);
    
    const analysisEl = document.createElement('p');
    analysisEl.textContent = item.analysis;
    itemEl.appendChild(analysisEl);
    
    content.appendChild(itemEl);
  });
  
  // Show alert
  container.style.display = 'block';
  
  // Also show notification
  alert("Misinformation detected in this video! Check the fact-check panel for details.");
}

function updateStatusIndicator(message) {
  const statusIndicator = document.getElementById('fact-check-status');
  if (statusIndicator) {
    statusIndicator.textContent = message;
    statusIndicator.style.display = 'block';
  }
}

function hideStatusIndicator() {
  const statusIndicator = document.getElementById('fact-check-status');
  if (statusIndicator) {
    statusIndicator.style.display = 'none';
  }
}