// apps/extension/build.js - Bundles Chrome Extension (MV3) for deployment and distribution
const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const distDir = path.join(srcDir, 'dist');

console.log('[TurboGrab Extension Builder] Packaging Manifest V3 extension...');

if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

const filesToCopy = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup.html',
  'popup.js',
  'popup.css',
];

for (const f of filesToCopy) {
  const srcPath = path.join(srcDir, f);
  const destPath = path.join(distDir, f);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`  ✓ Copied: ${f}`);
  } else {
    console.warn(`  ⚠ Missing: ${f}`);
  }
}

// Copy PNG icons
const iconsSrcDir = path.join(srcDir, 'icons');
const iconsDir = path.join(distDir, 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

if (fs.existsSync(iconsSrcDir)) {
  const iconFiles = fs.readdirSync(iconsSrcDir);
  for (const ic of iconFiles) {
    fs.copyFileSync(path.join(iconsSrcDir, ic), path.join(iconsDir, ic));
    console.log(`  ✓ Copied icon: ${ic}`);
  }
}

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="24" fill="#16A34A"/>
  <path d="M40 36 L96 64 L40 92 Z" fill="#FFFFFF"/>
</svg>`;
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), iconSvg);

// Validate manifest structure
const manifestRaw = fs.readFileSync(path.join(distDir, 'manifest.json'), 'utf8');
const manifest = JSON.parse(manifestRaw);

if (manifest.manifest_version !== 3) {
  throw new Error('Manifest version must be 3!');
}

console.log(`\n✓ Chrome Extension MV3 packaged successfully into: ${distDir}`);
console.log(`  Extension Name: ${manifest.name}`);
console.log(`  Version: ${manifest.version}`);
console.log(`  Permissions: ${manifest.permissions.join(', ')}`);
