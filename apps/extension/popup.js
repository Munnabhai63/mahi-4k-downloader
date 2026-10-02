document.addEventListener('DOMContentLoaded', () => {
  const btnDetectTab = document.getElementById('btn-detect-tab');
  const btnAnalyze = document.getElementById('btn-analyze');
  const inputUrl = document.getElementById('input-url');
  const resultCard = document.getElementById('result-card');
  const resultTitle = document.getElementById('result-title');
  const resultMeta = document.getElementById('result-meta');

  // Detect current tab URL
  btnDetectTab.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].url) {
          inputUrl.value = tabs[0].url;
          triggerAnalysis(tabs[0].url);
        }
      });
    } else {
      inputUrl.value = 'https://www.youtube.com/watch?v=demo';
      triggerAnalysis(inputUrl.value);
    }
  });

  btnAnalyze.addEventListener('click', () => {
    const url = inputUrl.value.trim();
    if (url) {
      triggerAnalysis(url);
    }
  });

  const btnDownload = document.getElementById('btn-download');

  btnDownload.addEventListener('click', async () => {
    const url = inputUrl.value.trim();
    if (!url) return;

    btnDownload.disabled = true;
    btnDownload.textContent = 'Queueing Download...';

    try {
      const res = await fetch('http://localhost:4000/api/v1/downloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, quality: '1080p', format: 'mp4' }),
      });

      if (res.ok) {
        btnDownload.textContent = 'Queued! Opening TurboGrab...';
      }
    } catch {
      // Fallback to web interface
    }

    setTimeout(() => {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({ url: `http://localhost:3000/?url=${encodeURIComponent(url)}` });
      } else {
        window.open(`http://localhost:3000/?url=${encodeURIComponent(url)}`, '_blank');
      }
      btnDownload.disabled = false;
      btnDownload.textContent = 'Download 1080p';
    }, 500);
  });

  function triggerAnalysis(url) {
    resultCard.classList.remove('hidden');
    resultTitle.textContent = 'Detecting video streams...';
    resultMeta.textContent = 'Target: ' + url.slice(0, 45) + '...';

    fetch('http://localhost:4000/api/v1/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.title) {
          resultTitle.textContent = data.title.slice(0, 40) + '...';
          const topQuality = data.qualities?.find((q) => q.available)?.label || '1080p';
          resultMeta.textContent = `${data.platform} • ${topQuality} • ~${Math.round(data.durationSec || 60)}s`;
          btnDownload.textContent = `Download ${topQuality}`;
        }
      })
      .catch(() => {
        resultTitle.textContent = 'Ready for Download (1080p MP4)';
        resultMeta.textContent = 'Quality: 1080p • Audio: AAC 320k';
      });
  }
});
