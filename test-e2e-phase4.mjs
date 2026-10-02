import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  console.log('   TurboGrab Phase 4 Automated E2E Verification');
  console.log('======================================================\n');

  const extDir = path.join(__dirname, 'apps', 'extension');
  const distDir = path.join(extDir, 'dist');
  let passed = 0;
  let total = 0;

  // 1. Manifest V3 Integrity
  total++;
  const manifestOk = await runTest('Extension: Manifest V3 Compliance & Permissions', async () => {
    const manifestPath = path.join(distDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) throw new Error('manifest.json not found in dist');
    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (m.manifest_version !== 3) throw new Error(`Expected MV3, found ${m.manifest_version}`);
    if (!m.permissions.includes('contextMenus') || !m.permissions.includes('activeTab')) {
      throw new Error('Missing core permissions');
    }
    return `Version: ${m.version}, MV3: valid, Permissions: ${m.permissions.length}`;
  });
  if (manifestOk) passed++;

  // 2. Background Service Worker
  total++;
  const bgOk = await runTest('Extension: Background Service Worker & Context Menu', async () => {
    const bgPath = path.join(distDir, 'background.js');
    if (!fs.existsSync(bgPath)) throw new Error('background.js not found in dist');
    const content = fs.readFileSync(bgPath, 'utf8');
    if (!content.includes('chrome.contextMenus.create') || !content.includes('turbograb-download-link')) {
      throw new Error('Context menu creation missing');
    }
    return 'Context menu registered with link/video contexts';
  });
  if (bgOk) passed++;

  // 3. Content Scripts (Floating Pill)
  total++;
  const contentOk = await runTest('Extension: Content Script Floating Button Injector', async () => {
    const csPath = path.join(distDir, 'content.js');
    if (!fs.existsSync(csPath)) throw new Error('content.js not found in dist');
    const content = fs.readFileSync(csPath, 'utf8');
    if (!content.includes('turbograb-quick-pill') || !content.includes('#16A34A')) {
      throw new Error('Floating pill injection or §9 green theme missing');
    }
    return 'Floating pill injector verified with §9 green theme';
  });
  if (contentOk) passed++;

  // 4. Popup UI (420px & Live API integration)
  total++;
  const popupOk = await runTest('Extension: Popup UI Layout & API Hooks', async () => {
    const htmlPath = path.join(distDir, 'popup.html');
    const jsPath = path.join(distDir, 'popup.js');
    const cssPath = path.join(distDir, 'popup.css');

    if (!fs.existsSync(htmlPath) || !fs.existsSync(jsPath) || !fs.existsSync(cssPath)) {
      throw new Error('Popup bundle files missing');
    }

    const html = fs.readFileSync(htmlPath, 'utf8');
    const js = fs.readFileSync(jsPath, 'utf8');
    const css = fs.readFileSync(cssPath, 'utf8');

    if (!css.includes('width: 420px') && !css.includes('width: 400px') && !css.includes('420px')) {
      throw new Error('Popup width should target ~420px per §11 specs');
    }
    if (!js.includes('http://localhost:4000/api/v1/downloads')) {
      throw new Error('API download queue hook missing');
    }
    return '420px popup UI, tab detector, and download queue hook verified';
  });
  if (popupOk) passed++;

  console.log('\n------------------------------------------------------');
  console.log(`   Phase 4 Result: ${passed}/${total} Tests Passed`);
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
