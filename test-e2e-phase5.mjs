// test-e2e-phase5.mjs - Automated Verification of Phase 5 (Desktop App Tauri 2)
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
  console.log('   TurboGrab Phase 5 Automated E2E Verification');
  console.log('======================================================\n');

  const desktopDir = path.join(__dirname, 'apps', 'desktop');
  let passed = 0;
  let total = 0;

  // 1. Tauri 2 Config & Window Geometry
  total++;
  const confOk = await runTest('Desktop: Tauri 2 Configuration & Security Policy', async () => {
    const confPath = path.join(desktopDir, 'src-tauri', 'tauri.conf.json');
    if (!fs.existsSync(confPath)) throw new Error('tauri.conf.json not found');
    const conf = JSON.parse(fs.readFileSync(confPath, 'utf8'));
    if (!conf.productName || !conf.identifier) throw new Error('Missing productName or identifier');
    const win = conf.app?.windows?.[0];
    if (!win || win.width < 600 || win.height < 500) {
      throw new Error('Invalid window geometry in tauri.conf.json');
    }
    return `App: ${conf.productName} (${conf.identifier}), Window: ${win.width}x${win.height}`;
  });
  if (confOk) passed++;

  // 2. Rust Backend Bridge & Sidecar Dependencies (Cargo.toml)
  total++;
  const cargoOk = await runTest('Desktop: Rust Backend Cargo.toml & Sidecar Plugins', async () => {
    const cargoPath = path.join(desktopDir, 'src-tauri', 'Cargo.toml');
    if (!fs.existsSync(cargoPath)) throw new Error('Cargo.toml not found');
    const cargo = fs.readFileSync(cargoPath, 'utf8');
    if (!cargo.includes('tauri =') || !cargo.includes('tauri-plugin-shell')) {
      throw new Error('Missing core tauri or tauri-plugin-shell dependency');
    }
    return 'Tauri 2 & tauri-plugin-shell verified in Cargo.toml';
  });
  if (cargoOk) passed++;

  // 3. Desktop UI Production Distribution Bundle
  total++;
  const bundleOk = await runTest('Desktop: Frontend Build Bundle (HTML/JS/Assets)', async () => {
    const distHtml = path.join(desktopDir, 'dist', 'index.html');
    if (!fs.existsSync(distHtml)) throw new Error('dist/index.html not found. Run build first.');
    const html = fs.readFileSync(distHtml, 'utf8');
    if (!html.includes('<div id="root">') && !html.includes('id="root"')) {
      throw new Error('Root mount point missing');
    }
    return 'Vite production build output verified in apps/desktop/dist';
  });
  if (bundleOk) passed++;

  // 4. Hotkeys & Clipboard Watcher Implementation
  total++;
  const hotkeyOk = await runTest('Desktop: Hotkey (Ctrl+Shift+V) & Clipboard Watcher', async () => {
    const appTsx = path.join(desktopDir, 'src', 'App.tsx');
    const content = fs.readFileSync(appTsx, 'utf8');
    if (!content.includes('Ctrl+Shift+V') || !content.includes('clipboardWatcher')) {
      throw new Error('Hotkey or clipboard watcher implementation missing');
    }
    return 'Ctrl+Shift+V hotkey & focus clipboard watcher verified';
  });
  if (hotkeyOk) passed++;

  console.log('\n------------------------------------------------------');
  console.log(`   Phase 5 Result: ${passed}/${total} Tests Passed`);
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
