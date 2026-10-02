// TurboGrab Background Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  // Create Context Menu for links
  chrome.contextMenus.create({
    id: 'turbograb-download-link',
    title: 'Download with TurboGrab',
    contexts: ['link', 'video', 'page'],
  });

  console.log('[TurboGrab Extension] Service Worker installed and context menu registered.');
});

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'turbograb-download-link') {
    const targetUrl = info.linkUrl || info.srcUrl || info.pageUrl;
    console.log('[TurboGrab Extension] Context menu triggered on:', targetUrl);
    
    // Update badge to indicate activity
    chrome.action.setBadgeText({ text: '1' });
    chrome.action.setBadgeBackgroundColor({ color: '#16A34A' });

    // Open Web app or trigger download
    chrome.tabs.create({
      url: `http://localhost:3000/?url=${encodeURIComponent(targetUrl)}`,
    });
  }
});
