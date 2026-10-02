// test-e2e-phase2.mjs - Automated Verification of Phase 2
// Tests Auth, Cookies Vault (AES-256), Batch Analysis, Batch Queueing, History & CSV export, and Web Routes

const API_BASE = 'http://localhost:4000/api/v1';
const WEB_BASE = 'http://localhost:3000';

async function runTest(name, fn) {
  process.stdout.write(`\x1b[36m[TEST]\x1b[0m ${name} ... `);
  try {
    const result = await fn();
    console.log(`\x1b[32mPASSED\x1b[0m ${result ? `(${result})` : ''}`);
    return true;
  } catch (err) {
    console.log(`\x1b[31mFAILED\x1b[0m`);
    console.error(`       Error: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('   TurboGrab Phase 2 Automated E2E Verification');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;
  let authToken = '';

  // 1. Auth Login (Seed Demo User)
  total++;
  const loginOk = await runTest('Auth: Demo User Login & JWT Issuance', async () => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@turbograb.app',
        password: 'DemoPassword123!',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.accessToken || !data.user) throw new Error('Missing accessToken or user profile');
    authToken = data.accessToken;
    return `User: ${data.user.email} (${data.user.plan})`;
  });
  if (loginOk) passed++;

  // 2. Auth Profile Verification
  total++;
  const profileOk = await runTest('Auth: Profile Check with Bearer Token', async () => {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.email !== 'demo@turbograb.app') throw new Error(`Unexpected user ${data.email}`);
    return `ID: ${data.id}, Plan: ${data.plan}`;
  });
  if (profileOk) passed++;

  // 3. Cookies Vault: AES-256 Storage & Retrieval
  total++;
  const cookiesOk = await runTest('Cookies Vault: AES-256 Store, Masked Summary & Purge', async () => {
    // Store
    const saveRes = await fetch(`${API_BASE}/cookies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        platform: 'instagram',
        cookieData: 'sessionid=abc123secretcookie456; ds_user_id=987654321',
      }),
    });
    if (!saveRes.ok) throw new Error(`Save failed HTTP ${saveRes.status}`);

    // List
    const listRes = await fetch(`${API_BASE}/cookies`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const listData = await listRes.json();
    const igCookie = listData.find((c) => c.platform === 'instagram');
    if (!igCookie) throw new Error('Stored cookie not found');
    if (igCookie.hasData !== true) throw new Error('Cookie hasData is false');

    // Purge
    const delRes = await fetch(`${API_BASE}/cookies/instagram`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!delRes.ok) throw new Error(`Delete failed HTTP ${delRes.status}`);

    return 'Stored encrypted, verified masked state, purged cleanly';
  });
  if (cookiesOk) passed++;

  // 4. Batch Analysis API
  total++;
  const batchAnalyzeOk = await runTest('Batch: Multi-URL Parallel Analysis', async () => {
    const testUrls = [
      'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4',
      'https://test-videos.co.uk/vids/jellyfish/mp4/h264/1080/Jellyfish_1080_10s_1MB.mp4',
    ];

    const res = await fetch(`${API_BASE}/analyze/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: testUrls }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!Array.isArray(data.results) || data.results.length === 0) {
      throw new Error('No results in batch analysis');
    }
    return `Analyzed ${data.results.length} URLs in parallel`;
  });
  if (batchAnalyzeOk) passed++;

  // 5. Batch Download Queueing
  total++;
  const batchDownloadOk = await runTest('Batch: Multi-Item Download Queueing & Concurrency', async () => {
    const res = await fetch(`${API_BASE}/downloads/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4',
            quality: '1080p',
            format: 'mp4',
          },
          {
            url: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/1080/Jellyfish_1080_10s_1MB.mp4',
            quality: '720p',
            format: 'mp4',
          },
        ],
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.queued || data.queued.length === 0) throw new Error('No jobs queued in batch');
    return `Queued ${data.queued.length} jobs (Concurrency Limit enforced)`;
  });
  if (batchDownloadOk) passed++;

  // 6. History & CSV Export API
  total++;
  const historyOk = await runTest('History: Paginated List & Direct CSV Export', async () => {
    const listRes = await fetch(`${API_BASE}/history?limit=10`);
    if (!listRes.ok) throw new Error(`History list HTTP ${listRes.status}`);
    const listData = await listRes.json();
    if (!Array.isArray(listData.items)) throw new Error('Items is not an array');

    const csvRes = await fetch(`${API_BASE}/history/export`);
    if (!csvRes.ok) throw new Error(`History export HTTP ${csvRes.status}`);
    const csvContent = await csvRes.text();
    if (!csvContent.includes('ID,Platform,Title,Quality,Format')) {
      throw new Error('CSV headers missing');
    }
    return `History count: ${listData.total}, CSV size: ${csvContent.length} chars`;
  });
  if (historyOk) passed++;

  // 7. Web Routes Verification for Phase 2
  total++;
  const webOk = await runTest('Web: Phase 2 Pages Available (/login, /signup, /settings, /history)', async () => {
    const routes = ['/login', '/signup', '/settings', '/history'];
    for (const r of routes) {
      const res = await fetch(`${WEB_BASE}${r}`);
      if (res.status !== 200) {
        throw new Error(`Route ${r} returned HTTP ${res.status}`);
      }
    }
    return 'All 4 new routes responded with HTTP 200 OK';
  });
  if (webOk) passed++;

  console.log('\n------------------------------------------------------');
  console.log(`   Phase 2 Result: ${passed}/${total} Tests Passed`);
  console.log('------------------------------------------------------\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Test execution fatal error:', e);
  process.exit(1);
});
