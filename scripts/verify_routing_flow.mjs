import { detectPlatformRoute } from '../apps/web/src/lib/routing.ts';

const testUrls = [
  { platform: 'YouTube', url: 'https://www.youtube.com/watch?v=1ZyIS1QAG68', expectedEngine: 'DESKTOP_PREFERRED' },
  { platform: 'YouTube Short', url: 'https://youtu.be/1ZyIS1QAG68', expectedEngine: 'DESKTOP_PREFERRED' },
  { platform: 'Instagram', url: 'https://www.instagram.com/reel/C8t1M2UvQ6-/', expectedEngine: 'DESKTOP_PREFERRED' },
  { platform: 'TikTok', url: 'https://www.tiktok.com/@tiktok/video/7106594312292453678', expectedEngine: 'DESKTOP_PREFERRED' },
  { platform: 'X / Twitter', url: 'https://x.com/Twitter/status/1274062719266185217', expectedEngine: 'DESKTOP_PREFERRED' },
  { platform: 'Facebook', url: 'https://www.facebook.com/watch?v=10153231379946729', expectedEngine: 'WEB_RELIABLE' },
  { platform: 'Archive.org', url: 'https://archive.org/details/Electra1962', expectedEngine: 'WEB_RELIABLE' },
  { platform: 'Direct MP4', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', expectedEngine: 'WEB_RELIABLE' },
];

console.log('=== VERIFYING PLATFORM ROUTING ENGINE ===\n');

let allPassed = true;

for (const t of testUrls) {
  const start = performance.now();
  const route = detectPlatformRoute(t.url);
  const elapsed = (performance.now() - start).toFixed(3);

  const passed = route.engine === t.expectedEngine;
  if (!passed) allPassed = false;

  console.log(`[${passed ? 'PASS' : 'FAIL'}] Platform: ${t.platform.padEnd(16)} | Engine: ${route.engine.padEnd(18)} | Match: ${t.expectedEngine.padEnd(18)} | Latency: ${elapsed}ms`);
  console.log(`       DisplayName: ${route.displayName} | Badge: ${route.recommendedResolution}`);
  console.log(`       DeepLink:    ${route.deepLink.slice(0, 60)}...`);
  console.log('--------------------------------------------------------------------------------');
}

console.log(`\nOverall Routing Table Test: ${allPassed ? 'ALL PASSED (100% CORRECT)' : 'FAILURES DETECTED'}`);
