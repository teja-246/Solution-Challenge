document.addEventListener('DOMContentLoaded', () => {
    const scanButton = document.getElementById('scanPage');
    const statusElement = document.getElementById('status');

    scanButton.addEventListener('click', () => {
        console.log('Scan button clicked');
        statusElement.innerText = 'Scanning...';

        chrome.runtime.sendMessage({ action: 'startScan' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error:', chrome.runtime.lastError.message);
                statusElement.innerText = `Scan Failed: ${chrome.runtime.lastError.message}`;
                return;
            }

            console.log('Received response:', response);

            if (response && response.detections) {
                const count = response.detections.totalHarmfulElements || 0;
                statusElement.innerText = `Scan Complete! Harmful Content Detected: ${count}`;
            } else {
                statusElement.innerText = 'No harmful content detected.';
            }
        });
    });
});
