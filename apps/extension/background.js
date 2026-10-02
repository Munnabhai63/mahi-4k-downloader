// My 4K Downloader — Background Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  // Create Context Menu for video/audio links
  chrome.contextMenus.create({
    id: 'm4k-download-link',
    title: 'Download with My 4K Downloader',
    contexts: ['link', 'video', 'audio', 'page'],
  });

  console.log('[My 4K Downloader] Service Worker installed and context menu registered.');
});

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'm4k-download-link') {
    const targetUrl = info.linkUrl || info.srcUrl || info.pageUrl;
    console.log('[My 4K Downloader] Context menu triggered on:', targetUrl);

    chrome.action.setBadgeText({ text: '1' });
    chrome.action.setBadgeBackgroundColor({ color: '#16A34A' });

    // Open Web app with pre-filled target URL
    const webAppUrl = 'https://mahi-4k-downloader.pages.dev';
    chrome.tabs.create({
      url: `${webAppUrl}/?url=${encodeURIComponent(targetUrl)}`,
    });
  }
});

// Handle direct download requests from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'download_file') {
    const rawFilename = request.filename || 'video_4k.mp4';
    // Clean safe filename across Windows/macOS/Linux
    const safeName = rawFilename.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'video.mp4';
    const downloadPath = `My 4K Downloader/${safeName}`;

    if (chrome.downloads && chrome.downloads.download) {
      chrome.downloads.download(
        {
          url: request.url,
          filename: downloadPath,
          conflictAction: 'uniquify', // Automatically creates "video (1).mp4", "video (2).mp4"
          saveAs: false,
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error('[My 4K Downloader] chrome.downloads error:', chrome.runtime.lastError.message);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            console.log('[My 4K Downloader] Download queued into My 4K Downloader/ folder. ID:', downloadId);
            sendResponse({ success: true, downloadId, path: downloadPath });
          }
        },
      );
      return true; // Keep message channel open for async response
    } else {
      sendResponse({ success: false, error: 'Browser downloads API is unavailable.' });
    }
  }
});
