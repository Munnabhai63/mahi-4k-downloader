// TurboGrab Content Script
// Injects a floating download pill near supported video players

(function () {
  console.log('[TurboGrab Extension] Content script loaded on:', window.location.hostname);

  function createFloatingButton() {
    if (document.getElementById('turbograb-quick-pill')) return;

    const pill = document.createElement('div');
    pill.id = 'turbograb-quick-pill';
    pill.innerHTML = `
      <div style="
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 6px;
        background-color: #16A34A;
        color: #FFFFFF;
        padding: 8px 14px;
        border-radius: 9999px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        font-weight: 700;
        box-shadow: 0 4px 14px rgba(22, 163, 74, 0.4);
        cursor: pointer;
        transition: transform 0.2s, background-color 0.2s;
      ">
        <span>⬇</span>
        <span>Download with TurboGrab</span>
      </div>
    `;

    pill.addEventListener('mouseenter', () => {
      pill.firstElementChild.style.transform = 'scale(1.05)';
      pill.firstElementChild.style.backgroundColor = '#15803D';
    });

    pill.addEventListener('mouseleave', () => {
      pill.firstElementChild.style.transform = 'scale(1)';
      pill.firstElementChild.style.backgroundColor = '#16A34A';
    });

    pill.addEventListener('click', () => {
      const pageUrl = window.location.href;
      window.open(`http://localhost:3000/?url=${encodeURIComponent(pageUrl)}`, '_blank');
    });

    document.body.appendChild(pill);
  }

  // Inject pill when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFloatingButton);
  } else {
    createFloatingButton();
  }
})();
