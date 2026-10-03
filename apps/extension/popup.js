document.addEventListener('DOMContentLoaded', () => {
  const btnDetectTab = document.getElementById('btn-detect-tab');
  const btnAnalyze = document.getElementById('btn-analyze');
  const inputUrl = document.getElementById('input-url');
  const resultCard = document.getElementById('result-card');
  const resultTitle = document.getElementById('result-title');
  const resultMeta = document.getElementById('result-meta');
  const btnDownload = document.getElementById('btn-download');
  const btnDesktop = document.getElementById('btn-desktop');

  const API_BASE = 'https://api4k.mahiskills.in/api/v1';
  const WEB_APP = 'https://mahi-4k-downloader.pages.dev';

  let currentAnalysis = null;

  function isDesktopPreferred(url) {
    const lower = (url || '').toLowerCase();
    return (
      lower.includes('youtube.com') ||
      lower.includes('youtu.be') ||
      lower.includes('instagram.com') ||
      lower.includes('tiktok.com') ||
      lower.includes('twitter.com') ||
      lower.includes('x.com')
    );
  }

  function launchDesktop(url) {
    const deepLink = `m4k://download?url=${encodeURIComponent(url)}`;
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: deepLink });
    } else {
      window.location.href = deepLink;
    }
  }

  if (btnDesktop) {
    btnDesktop.addEventListener('click', () => {
      const url = inputUrl.value.trim();
      if (url) launchDesktop(url);
    });
  }

  // Detect current active tab URL
  btnDetectTab.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].url) {
          inputUrl.value = tabs[0].url;
          triggerAnalysis(tabs[0].url);
        }
      });
    } else {
      inputUrl.value = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';
      triggerAnalysis(inputUrl.value);
    }
  });

  btnAnalyze.addEventListener('click', () => {
    const url = inputUrl.value.trim();
    if (url) {
      triggerAnalysis(url);
    }
  });

  btnDownload.addEventListener('click', async () => {
    const url = inputUrl.value.trim();
    if (!url) return;

    btnDownload.disabled = true;
    btnDownload.textContent = 'Starting Download...';

    const quality = currentAnalysis?.topQuality || '1080p';
    const filename = `${(currentAnalysis?.title || 'video').slice(0, 50)}.mp4`;

    try {
      const res = await fetch(`${API_BASE}/downloads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, quality, format: 'mp4' }),
      });

      if (res.ok) {
        const item = await res.json();
        btnDownload.textContent = 'Queued! Saving to My 4K Downloader...';

        // Check if signedUrl or poll status
        if (item.signedUrl) {
          triggerExtensionDownload(item.signedUrl, filename);
        } else {
          // Open web app to track live progress and save to folder
          setTimeout(() => {
            openWebDownloader(url);
          }, 600);
        }
      } else {
        openWebDownloader(url);
      }
    } catch {
      // Fallback to web interface
      openWebDownloader(url);
    }

    setTimeout(() => {
      btnDownload.disabled = false;
      btnDownload.textContent = `Download ${quality}`;
    }, 2000);
  });

  function triggerExtensionDownload(downloadUrl, filename) {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(
        { action: 'download_file', url: downloadUrl, filename },
        (response) => {
          if (response && response.success) {
            btnDownload.textContent = 'Saved to My 4K Downloader!';
          }
        },
      );
    }
  }

  function openWebDownloader(url) {
    const target = `${WEB_APP}/?url=${encodeURIComponent(url)}`;
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: target });
    } else {
      window.open(target, '_blank');
    }
  }

  function triggerAnalysis(url) {
    resultCard.classList.remove('hidden');
    resultTitle.textContent = 'Analyzing media stream...';
    resultMeta.textContent = 'Checking format availability...';

    if (isDesktopPreferred(url)) {
      if (btnDesktop) {
        btnDesktop.style.display = 'flex';
        btnDesktop.textContent = '⚡ Open in Desktop App (4K Recommended)';
      }
    } else {
      if (btnDesktop) btnDesktop.style.display = 'none';
    }

    fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.title) {
          const topQuality = data.qualities?.find((q) => q.available)?.label || '1080p';
          currentAnalysis = { title: data.title, topQuality, data };
          resultTitle.textContent = data.title.slice(0, 45) + (data.title.length > 45 ? '...' : '');
          resultMeta.textContent = `${data.platform || 'Video'} • ${topQuality} • ~${Math.round(data.durationSec || 60)}s`;
          btnDownload.textContent = `Download ${topQuality} MP4`;
        } else {
          resultTitle.textContent = 'Media Ready for Download';
          resultMeta.textContent = isDesktopPreferred(url) 
            ? 'Desktop App recommended for high-resolution 4K'
            : 'Quality: 1080p / Best MP4';
        }
      })
      .catch(() => {
        resultTitle.textContent = 'Open in My 4K Downloader Desktop';
        resultMeta.textContent = 'Direct residential extraction for 4K / 1080p';
        if (btnDesktop) {
          btnDesktop.style.display = 'flex';
          btnDesktop.textContent = '⚡ Open in Desktop App (m4k://)';
        }
      });
  }
});
