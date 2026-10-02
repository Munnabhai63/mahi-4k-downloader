// scripts/verify_pages_deploy.js
const https = require('https');

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Cache-Control': 'no-cache' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function checkPages() {
  console.log('Checking https://mahi-4k-downloader.pages.dev/ deployment...');
  for (let i = 0; i < 20; i++) {
    try {
      const html = await fetchText('https://mahi-4k-downloader.pages.dev/?t=' + Date.now());
      const regex = /src="(\/_next\/static\/chunks\/[^"]+\.js)"/g;
      let match;
      let scripts = [];
      while ((match = regex.exec(html)) !== null) {
        scripts.push(match[1]);
      }

      for (const s of scripts) {
        const scriptUrl = 'https://mahi-4k-downloader.pages.dev' + s;
        const sText = await fetchText(scriptUrl);
        if (sText.includes('api4k.mahiskills.in')) {
          console.log('LIVE: Cloudflare Pages is serving new build! Found api4k.mahiskills.in in:', s);
          return true;
        }
      }
    } catch (e) {
      console.log('Poll attempt error:', e.message);
    }
    console.log(`Waiting for Cloudflare Pages build/propagation... (${i + 1}/20)`);
    await new Promise(r => setTimeout(r, 6000));
  }
  return false;
}

checkPages().then(ok => {
  if (ok) {
    console.log('SUCCESS: Production Cloudflare Pages is officially live with api4k.mahiskills.in!');
    process.exit(0);
  } else {
    console.log('PENDING: Still waiting for Cloudflare Pages deploy.');
    process.exit(1);
  }
});
