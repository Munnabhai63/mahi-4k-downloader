import assert from 'assert';
import fs from 'fs';

const API_BASE = 'http://localhost:4000/api/v1';
const WEB_BASE = 'http://localhost:3000';

async function runTests() {
  console.log('=== TurboGrab Phase 1 E2E Verification Suite ===\n');

  // 1. Health check
  console.log('[Test 1] Health Check...');
  const healthRes = await fetch('http://localhost:4000/health');
  assert.strictEqual(healthRes.status, 200);
  const healthData = await healthRes.json();
  assert.strictEqual(healthData.status, 'ok');
  console.log('  ✓ API is healthy');

  // 2. SSRF Protection
  console.log('[Test 2] SSRF Protection...');
  const ssrfRes = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'http://169.254.169.254/metadata' }),
  });
  assert.strictEqual(ssrfRes.status, 400);
  const ssrfData = await ssrfRes.json();
  assert(ssrfData.message.includes('blocked'));
  console.log('  ✓ SSRF blocked:', ssrfData.message);

  // 3. DRM Platform Blocking (§3 requirement)
  console.log('[Test 3] DRM Platform Blocking...');
  const drmRes = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://www.netflix.com/watch/12345' }),
  });
  assert.strictEqual(drmRes.status, 400);
  const drmData = await drmRes.json();
  assert.strictEqual(
    drmData.message,
    'This platform is not supported. TurboGrab strictly adheres to copyright and DRM protection standards.'
  );
  console.log('  ✓ DRM platform blocked with mandatory legal text');

  // 4. URL Analysis & Resolution Matrix
  console.log('[Test 4] Video URL Analysis...');
  const analyzeRes = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' }),
  });
  assert.strictEqual(analyzeRes.status, 200);
  const videoData = await analyzeRes.json();
  assert.strictEqual(videoData.platform, 'youtube');
  assert(videoData.title.includes('Big Buck Bunny'));
  assert(videoData.qualities.length >= 7);
  assert(videoData.qualities.some((q) => q.label === '4K' && q.available));
  assert(videoData.qualities.some((q) => q.label === '1080p' && q.available));
  assert(videoData.qualities.some((q) => q.label === 'Audio' && q.available));
  console.log(`  ✓ Analyzed: "${videoData.title}"`);
  console.log(`  ✓ Available Qualities: ${videoData.qualities.filter(q => q.available).map(q => q.label).join(', ')}`);

  // 5. Download Execution & Signed URL Verification
  console.log('[Test 5] Download Job Initiation & Signed URL Streaming...');
  const dlRes = await fetch(`${API_BASE}/downloads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      quality: '360p',
      format: 'mp4',
    }),
  });
  assert.strictEqual(dlRes.status, 201);
  const dlJob = await dlRes.json();
  assert(dlJob.id);
  console.log(`  ✓ Download queued with ID: ${dlJob.id}`);

  // Poll for completion (up to 45s)
  let completedJob = null;
  for (let i = 0; i < 45; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const statusRes = await fetch(`${API_BASE}/downloads/${dlJob.id}`);
    const job = await statusRes.json();
    if (job.status === 'COMPLETED') {
      completedJob = job;
      break;
    }
  }

  assert(completedJob, 'Download did not complete in time');
  assert.strictEqual(completedJob.status, 'COMPLETED');
  assert(completedJob.totalBytes > 1000000, 'Downloaded file size must be > 1MB');
  assert(completedJob.outputPath && fs.existsSync(completedJob.outputPath));
  console.log(`  ✓ Download completed: ${(completedJob.totalBytes / (1024 * 1024)).toFixed(2)} MB`);

  // Verify signed URL streaming
  const streamRes = await fetch(`http://localhost:4000${completedJob.signedUrl}`);
  assert.strictEqual(streamRes.status, 200);
  assert(streamRes.headers.get('content-disposition')?.includes('attachment'));
  console.log('  ✓ Signed URL streaming verified with Content-Disposition header');

  // 6. DMCA Takedown Notice Portal
  console.log('[Test 6] DMCA Takedown Submission...');
  const dmcaRes = await fetch(`${API_BASE}/dmca`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reporterEmail: 'legal@rightsholder.com',
      targetUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      reason: 'Copyright infringement notice test',
      infringementProof: 'REG-US-99182',
      signature: 'Johnathan Doe',
    }),
  });
  assert.strictEqual(dmcaRes.status, 201);
  const dmcaData = await dmcaRes.json();
  assert.strictEqual(dmcaData.success, true);
  assert(dmcaData.reportId);
  console.log(`  ✓ DMCA notice recorded with ID: ${dmcaData.reportId}`);

  // 7. Web Application Page Routes
  console.log('[Test 7] Next.js Web Application Page Routes...');
  const pages = ['/', '/terms', '/privacy', '/dmca', '/downloads'];
  for (const p of pages) {
    const pageRes = await fetch(`${WEB_BASE}${p}`);
    assert.strictEqual(pageRes.status, 200, `Page ${p} failed to return 200`);
    const html = await pageRes.text();
    assert(html.includes('Turbo'), `Page ${p} missing Turbo branding`);
    console.log(`  ✓ ${p} served HTTP 200 with complete HTML`);
  }

  console.log('\n======================================================');
  console.log('✅ ALL PHASE 1 ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY');
  console.log('======================================================');
}

runTests().catch((err) => {
  console.error('\n❌ E2E TEST FAILED:', err);
  process.exit(1);
});
