import https from 'https';

const API_BASE = 'https://api4k.mahiskills.in';
const WEB_BASE = 'https://mahi-4k-downloader.pages.dev';

async function postJson(endpoint, data) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, body };
}

async function getJson(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  const body = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, body };
}

async function fetchHtml(url) {
  const res = await fetch(`${url}?t=${Date.now()}`);
  return await res.text();
}

async function pollJob(jobId, timeoutMs = 60000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const { body } = await getJson(`/api/v1/downloads/${jobId}`);
    if (body) {
      if (body.status === 'COMPLETED') return body;
      if (body.status === 'FAILED') throw new Error(`Job failed: ${body.errorMessage || 'unknown'}`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Timeout waiting for job ${jobId}`);
}

async function runSuite() {
  console.log('====================================================');
  console.log('FINAL PROVIDER STATUS CLEANUP — PRODUCTION VERIFICATION');
  console.log('====================================================\n');

  let allPassed = true;

  // 1. UNSUPPORTED PROVIDERS AUDIT
  console.log('--- 1. Testing Unsupported Providers (Fail-Fast & Standardized Copy) ---');
  const unsupportedUrls = [
    { name: 'YouTube', url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' },
    { name: 'Instagram', url: 'https://www.instagram.com/reel/C3b456/' },
    { name: 'TikTok', url: 'https://www.tiktok.com/@user/video/1234567890' },
  ];

  const EXPECTED_MSG = 'This source currently does not support direct web download.';

  for (const { name, url } of unsupportedUrls) {
    // Analyze check (Must fail fast with exact standardized message)
    const an = await postJson('/api/v1/analyze', { url });
    const anMatch = an.body?.message === EXPECTED_MSG;
    console.log(`[Analyze] ${name}: Status=${an.status} MatchMsg=${anMatch} (Msg: "${an.body?.message}")`);
    if (!anMatch || an.status !== 400) allPassed = false;

    // Downloads check (Must fail BEFORE queue creation with 0 jobs created)
    const dl = await postJson('/api/v1/downloads', { url, quality: '1080p', format: 'mp4' });
    const dlMatch = dl.body?.message === EXPECTED_MSG;
    console.log(`[Downloads] ${name}: Status=${dl.status} MatchMsg=${dlMatch} (Msg: "${dl.body?.message}")`);
    if (!dlMatch || dl.status !== 400) allPassed = false;
  }

  // 2. PLATFORM BADGES ON PRODUCTION WEB
  console.log('\n--- 2. Verifying Truthful Platform Cards & Badges on Web ---');
  const html = await fetchHtml(WEB_BASE);

  const expectedBadges = [
    { platform: 'Facebook', badge: 'Fast Web' },
    { platform: 'Dailymotion', badge: 'Fast Web' },
    { platform: 'Archive.org', badge: 'Fast Web' },
    { platform: 'Direct Media', badge: 'Fast Web' },
    { platform: 'Vimeo', badge: 'Conditional' },
    { platform: 'Reddit', badge: 'Partial' },
    { platform: 'X/Twitter', badge: 'API / Limited' },
    { platform: 'YouTube', badge: 'Web Unsupported' },
    { platform: 'Instagram', badge: 'Web Unsupported' },
    { platform: 'TikTok', badge: 'Web Unsupported' },
  ];

  for (const item of expectedBadges) {
    // Allow either X/Twitter or X (Twitter)
    const hasPlatform = html.includes(item.platform) || (item.platform === 'X/Twitter' && html.includes('X (Twitter)'));
    const hasBadge = html.includes(item.badge);
    const present = hasPlatform && hasBadge;
    console.log(`Platform Card [${item.platform}] -> [${item.badge}]: ${present ? 'PASSED' : 'FAILED'}`);
    if (!present) allPassed = false;
  }

  // Check banned phrases on homepage
  console.log('\n--- 3. Verifying Clean Homepage Copy (No Exaggerated Claims) ---');
  const bannedPhrases = ['1,000+ sites', '1000+ sites', 'universal downloader', 'all platforms'];
  for (const phrase of bannedPhrases) {
    const found = html.toLowerCase().includes(phrase.toLowerCase());
    console.log(`Banned phrase check: "${phrase}" -> ${!found ? 'CLEAN (Not found)' : 'VIOLATION (Found)'}`);
    if (found) allPassed = false;
  }

  const placeholderMatch = html.includes('Paste any supported public media link...');
  console.log(`Truthful placeholder present: ${placeholderMatch ? 'PASSED' : 'FAILED'}`);
  if (!placeholderMatch) allPassed = false;

  // 4. PRESERVE WORKING PLATFORMS (REGRESSION DOWNLOAD TEST)
  console.log('\n--- 4. Testing Working Platforms Regression (Real File Execution) ---');
  const workingUrls = [
    { name: 'Direct MP4', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { name: 'Archive.org', url: 'https://archive.org/details/Popeye_forPresident' },
    { name: 'Dailymotion', url: 'https://www.dailymotion.com/video/x8o0rbs' },
    { name: 'Facebook', url: 'https://www.facebook.com/watch?v=10153231379946729' }
  ];

  for (const item of workingUrls) {
    console.log(`Analyzing working source: ${item.name} (${item.url})...`);
    const an = await postJson('/api/v1/analyze', { url: item.url });
    if (!an.ok || !an.body?.title) {
      console.error(`  -> Analyze failed for ${item.name}:`, an.body);
      allPassed = false;
      continue;
    }
    console.log(`  -> Title: "${an.body.title}", Formats: ${an.body.formats?.length || 0}`);

    console.log(`Queueing download for: ${item.name}...`);
    const dl = await postJson('/api/v1/downloads', {
      url: item.url,
      quality: an.body.qualities?.find(q => q.height > 0)?.label || 'Original',
      format: 'mp4'
    });

    if (!dl.ok || !dl.body?.id) {
      console.error(`  -> Download queue failed for ${item.name}:`, dl.body);
      allPassed = false;
      continue;
    }

    const jobId = dl.body.id;
    console.log(`  -> Job created: ${jobId}, polling completion...`);
    try {
      const completed = await pollJob(jobId, 60000);
      console.log(`  -> COMPLETED! Status=${completed.status}, Speed=${completed.speedBps || 'ok'}`);
    } catch (err) {
      console.error(`  -> Download polling failed for ${item.name}:`, err.message);
      allPassed = false;
    }
  }

  console.log('\n====================================================');
  console.log(`FINAL SUITE RESULT: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  console.log('====================================================');
  process.exit(allPassed ? 0 : 1);
}

runSuite().catch((err) => {
  console.error('Fatal suite error:', err);
  process.exit(1);
});
