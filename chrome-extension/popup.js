document.addEventListener('DOMContentLoaded', () => {
    const scanButton = document.getElementById('scanPage');
    const statusElement = document.getElementById('status');

    scanButton.addEventListener('click', () => {
        console.log('Scan button clicked');
        statusElement.innerText = 'Scanning...';
        chrome.runtime.sendMessage({ action: 'startScan' }, (response) => {
            console.log('Received response:', response);

            if (chrome.runtime.lastError) {
                console.error('Error:', chrome.runtime.lastError);
                statusElement.innerText = 'Scan Failed: ' + chrome.runtime.lastError.message;
                return;
            }

            if (response && response.detections) {
                const count = response.detections.harmfulContent || 0;
                statusElement.innerText = `Scan Complete! Harmful Content: ${count}`;
            } else {
                statusElement.innerText = 'No harmful content detected';
            }
        });
    });
});