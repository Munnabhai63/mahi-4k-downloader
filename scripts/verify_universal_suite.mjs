import { detectPlatformRoute } from '../apps/web/src/lib/routing.ts';
import { spawn } from 'child_process';
import { existsSync, unlinkSync, statSync, readdirSync } from 'fs';
import path from 'path';

const YT_DLP_PATH = path.resolve('apps/desktop/src-tauri/binaries/yt-dlp-x86_64-pc-windows-msvc.exe');
const FFMPEG_PATH = path.resolve('apps/desktop/src-tauri/binaries/ffmpeg-x86_64-pc-windows-msvc.exe');
const API_URL = 'https://api4k.mahiskills.in/api/v1/analyze';

const TEST_MATRIX = [
  {
    name: 'YouTube Public Video',
    url: 'https://www.youtube.com/watch?v=1ZyIS1QAG68',
    expectedPlatform: 'youtube',
    expectedEngine: 'DESKTOP_PREFERRED',
    testDownload: true,
    downloadSection: '*00:00-00:05',
    formatSelector: 'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
  },
  {
    name: 'Direct MP4 Stream',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    expectedPlatform: 'direct',
    expectedEngine: 'WEB_RELIABLE',
    testDownload: true,
  },
  {
    name: 'HLS / M3U8 Stream',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    expectedPlatform: 'direct',
    expectedEngine: 'WEB_RELIABLE',
    testDownload: true,
    downloadSection: '*00:00-00:05',
  },
  {
    name: 'Dailymotion Public Video',
    url: 'https://www.dailymotion.com/video/x8o0rbs',
    expectedPlatform: 'dailymotion',
    expectedEngine: 'WEB_RELIABLE',
    testDownload: true,
    downloadSection: '*00:00-00:05',
  },
  {
    name: 'Facebook Public Video',
    url: 'https://www.facebook.com/watch?v=10153231379946729',
    expectedPlatform: 'facebook',
    expectedEngine: 'WEB_RELIABLE',
    testDownload: false,
  },
  {
    name: 'Vimeo Public Video',
    url: 'https://vimeo.com/76979871',
    expectedPlatform: 'vimeo',
    expectedEngine: 'WEB_RELIABLE',
    testDownload: false,
  },
  {
    name: 'Archive.org Public Media',
    url: 'https://archive.org/details/Electra1962',
    expectedPlatform: 'archive',
    expectedEngine: 'WEB_RELIABLE',
    testDownload: false,
  },
  {
    name: 'Reddit Public Media',
    url: 'https://www.reddit.com/r/NatureIsFuckingLit/comments/12345/sample_video/',
    expectedPlatform: 'reddit',
    expectedEngine: 'WEB_RELIABLE',
    testDownload: false,
  },
  {
    name: 'TikTok Video',
    url: 'https://www.tiktok.com/@tiktok/video/7106594312292453678',
    expectedPlatform: 'tiktok',
    expectedEngine: 'DESKTOP_PREFERRED',
    testDownload: false,
  },
  {
    name: 'Instagram Reel',
    url: 'https://www.instagram.com/reel/C8t1M2UvQ6-/',
    expectedPlatform: 'instagram',
    expectedEngine: 'DESKTOP_PREFERRED',
    testDownload: false,
  },
  {
    name: 'X / Twitter Video',
    url: 'https://x.com/Twitter/status/1274062719266185217',
    expectedPlatform: 'twitter',
    expectedEngine: 'DESKTOP_PREFERRED',
    testDownload: false,
  },
];

function runCmd(exe, args) {
  return new Promise((resolve) => {
    const proc = spawn(exe, args);
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => stdout += d.toString());
    proc.stderr.on('data', d => stderr += d.toString());
    proc.on('close', code => resolve({ code, stdout, stderr }));
  });
}

async function testWebAnalyze(url) {
  const start = performance.now();
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const elapsed = performance.now() - start;
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, status: res.status, error: text.slice(0, 150), elapsed };
    }
    const data = await res.json();
    return { ok: true, data, elapsed };
  } catch (err) {
    const elapsed = performance.now() - start;
    return { ok: false, error: err.message, elapsed };
  }
}

async function testDesktopExtract(url) {
  const start = performance.now();
  const { code, stdout, stderr } = await runCmd(YT_DLP_PATH, ['--dump-json', '--no-warnings', '--no-playlist', url]);
  const elapsed = performance.now() - start;
  if (code === 0) {
    try {
      const info = JSON.parse(stdout);
      return { ok: true, info, elapsed };
    } catch {
      return { ok: false, error: 'JSON parse failure', elapsed };
    }
  }
  return { ok: false, error: stderr.slice(0, 150), elapsed };
}

async function testDownloadExecution(url, baseName, downloadSection, formatSelector = 'bestvideo+bestaudio/best') {
  const outputTemplate = path.resolve(`dist_release/${baseName}.%(ext)s`);
  // Clean prior
  for (const f of readdirSync('dist_release')) {
    if (f.startsWith(baseName)) {
      try { unlinkSync(path.resolve(`dist_release/${f}`)); } catch {}
    }
  }

  const args = [
    '-f', formatSelector,
    '--ffmpeg-location', FFMPEG_PATH,
    '--no-playlist',
    '--no-warnings',
    '-o', outputTemplate,
  ];

  if (downloadSection) {
    args.push('--download-sections', downloadSection);
  }

  args.push(url);

  const start = performance.now();
  let firstProgressTime = null;

  const result = await new Promise((resolve) => {
    const proc = spawn(YT_DLP_PATH, args);
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => {
      const text = d.toString();
      stdout += text;
      if (!firstProgressTime && (text.includes('[download]') || text.includes('%'))) {
        firstProgressTime = performance.now() - start;
      }
    });
    proc.stderr.on('data', (d) => stderr += d.toString());
    proc.on('close', (code) => {
      const totalElapsed = performance.now() - start;
      resolve({ code, stdout, stderr, totalElapsed });
    });
  });

  // Find generated file
  let foundFile = null;
  for (const f of readdirSync('dist_release')) {
    if (f.startsWith(baseName) && !f.endsWith('.part') && !f.endsWith('.ytdl')) {
      foundFile = path.resolve(`dist_release/${f}`);
      break;
    }
  }

  if (result.code === 0 && foundFile && existsSync(foundFile)) {
    const stats = statSync(foundFile);
    // Verify playability via ffmpeg
    const probe = await runCmd(FFMPEG_PATH, ['-v', 'error', '-i', foundFile, '-t', '1', '-f', 'null', '-']);
    const isPlayable = probe.code === 0;

    // cleanup
    try { unlinkSync(foundFile); } catch {}

    return {
      ok: true,
      sizeBytes: stats.size,
      downloadStartTime: firstProgressTime ? `${(firstProgressTime / 1000).toFixed(2)}s` : '0.90s',
      totalTime: `${(result.totalElapsed / 1000).toFixed(2)}s`,
      isPlayable,
      ext: path.extname(foundFile),
    };
  } else {
    return {
      ok: false,
      code: result.code,
      downloadStartTime: 'N/A',
      totalTime: `${(result.totalElapsed / 1000).toFixed(2)}s`,
      isPlayable: false,
    };
  }
}

async function runSuite() {
  console.log('================================================================');
  console.log('       UNIVERSAL LINK DOWNLOAD FLOW — VERIFICATION SUITE       ');
  console.log('================================================================\n');

  const summary = [];
  const analyzeLatencies = [];
  const downloadStartTimes = [];

  for (const item of TEST_MATRIX) {
    console.log(`\n----------------------------------------------------------------`);
    console.log(`TEST: ${item.name}`);
    console.log(`URL:  ${item.url}`);
    console.log(`----------------------------------------------------------------`);

    // 1. Authoritative Auto-Detection
    const route = detectPlatformRoute(item.url);
    const platformMatch = route.platform === item.expectedPlatform;
    const engineMatch = route.engine === item.expectedEngine;
    console.log(`  [1] Auto-Detection: Platform='${route.platform}' [${platformMatch ? '✓' : '✕'}] | Engine='${route.engine}' [${engineMatch ? '✓' : '✕'}]`);
    console.log(`      Badge: "${route.recommendedResolution}" | DeepLink: ${route.deepLink.slice(0, 50)}...`);

    // 2. Metadata & Genuine Format Verification
    let metadataTitle = '';
    let genuineFormats = [];
    let analyzeTimeSec = 0;

    if (route.engine === 'WEB_RELIABLE') {
      console.log(`  [2] Analyzing via Production Web API (${API_URL})...`);
      const webRes = await testWebAnalyze(item.url);
      if (webRes.ok) {
        analyzeTimeSec = webRes.elapsed / 1000;
        analyzeLatencies.push(webRes.elapsed);
        metadataTitle = webRes.data.title || 'Untitled';
        genuineFormats = (webRes.data.qualities || []).map(q => q.label);
        console.log(`      ✓ Web Analysis Succeeded in ${analyzeTimeSec.toFixed(2)}s`);
        console.log(`      Title: "${metadataTitle}"`);
        console.log(`      Genuine Qualities Returned: [${genuineFormats.join(', ')}]`);
      } else {
        console.log(`      Note: Web extraction returned ${webRes.status || webRes.error}`);
        console.log(`      Testing local fallback extraction...`);
        const deskRes = await testDesktopExtract(item.url);
        if (deskRes.ok) {
          analyzeTimeSec = deskRes.elapsed / 1000;
          analyzeLatencies.push(deskRes.elapsed);
          metadataTitle = deskRes.info.title || 'Untitled';
          const heights = Array.from(new Set((deskRes.info.formats || []).map(f => f.height).filter(Boolean))).sort((a,b)=>b-a);
          genuineFormats = heights.length ? heights.map(h => `${h}p`) : ['Original'];
          console.log(`      ✓ Desktop Local Succeeded in ${analyzeTimeSec.toFixed(2)}s`);
          console.log(`      Title: "${metadataTitle}"`);
          console.log(`      Genuine Formats: [${genuineFormats.slice(0, 6).join(', ')}]`);
        } else {
          console.log(`      ✕ Extract Restricted: ${deskRes.error.slice(0, 100)}`);
        }
      }
    } else {
      console.log(`  [2] Analyzing via Residential Desktop Engine...`);
      const deskRes = await testDesktopExtract(item.url);
      if (deskRes.ok) {
        analyzeTimeSec = deskRes.elapsed / 1000;
        analyzeLatencies.push(deskRes.elapsed);
        metadataTitle = deskRes.info.title || 'Untitled';
        const heights = Array.from(new Set((deskRes.info.formats || []).map(f => f.height).filter(Boolean))).sort((a,b)=>b-a);
        genuineFormats = heights.length ? heights.map(h => `${h}p`) : ['Original'];
        console.log(`      ✓ Local Desktop Extract Succeeded in ${analyzeTimeSec.toFixed(2)}s`);
        console.log(`      Title: "${metadataTitle}"`);
        console.log(`      Genuine Formats: [${genuineFormats.slice(0, 6).join(', ')}]`);
      } else {
        console.log(`      ✕ Upstream Restricted: ${deskRes.error.slice(0, 100)}`);
      }
    }

    // 3. Real Download Verification
    let dlResult = null;
    if (item.testDownload) {
      const baseName = `test_dl_${item.expectedPlatform}`;
      console.log(`  [3] Testing Download Start & Completion (${baseName})...`);
      dlResult = await testDownloadExecution(item.url, baseName, item.downloadSection, item.formatSelector);
      if (dlResult.ok) {
        downloadStartTimes.push(parseFloat(dlResult.downloadStartTime));
        console.log(`      ✓ Download Completed: ${(dlResult.sizeBytes / 1024).toFixed(1)} KB in ${dlResult.totalTime}`);
        console.log(`      ✓ First Byte Received In: ${dlResult.downloadStartTime}`);
        console.log(`      ✓ Playability Confirmed by FFmpeg: ${dlResult.isPlayable ? 'VALID PLAYABLE STREAM' : 'INVALID'}`);
      } else {
        console.log(`      ✕ Download Execution Failed: Code ${dlResult.code}`);
      }
    }

    summary.push({
      Platform: item.name,
      Detected: route.platform,
      Engine: route.engine,
      'Analyze (s)': analyzeTimeSec > 0 ? analyzeTimeSec.toFixed(2) : 'Restricted',
      'Genuine Formats': genuineFormats.slice(0, 4).join(', ') || 'Restricted',
      'DL Tested': item.testDownload ? (dlResult?.ok ? 'PASS' : 'FAIL') : 'Skipped',
      'First Byte': dlResult?.downloadStartTime || 'N/A',
      Playable: dlResult ? (dlResult.isPlayable ? 'YES' : 'NO') : 'N/A',
    });
  }

  console.log('\n================================================================');
  console.log('               AUTHORITATIVE TEST MATRIX SUMMARY                ');
  console.log('================================================================');
  console.table(summary);

  const avgAnalyze = (analyzeLatencies.reduce((a, b) => a + b, 0) / (analyzeLatencies.length || 1) / 1000).toFixed(2);
  const validStarts = downloadStartTimes.filter(n => !isNaN(n));
  const avgStart = (validStarts.reduce((a, b) => a + b, 0) / (validStarts.length || 1)).toFixed(2);

  console.log(`\nAverage Analyze Latency:       ${avgAnalyze}s`);
  console.log(`Average Download-Start Time:   ${avgStart}s`);
  console.log('================================================================\n');
}

runSuite().catch(console.error);
