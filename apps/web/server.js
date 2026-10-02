// apps/web/server.js - High-performance static web server for Next.js exported out/
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Parse port argument or environment variable
let port = process.env.PORT || 3000;
const portArgIndex = process.argv.findIndex((arg) => arg === '--port' || arg === '-p');
if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
  port = parseInt(process.argv[portArgIndex + 1], 10);
}

// Locate out directory
let outDir = path.join(__dirname, 'out');
if (!fs.existsSync(outDir)) {
  outDir = path.join(process.cwd(), 'out');
}
if (!fs.existsSync(outDir)) {
  outDir = path.join(process.cwd(), 'apps', 'web', 'out');
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json',
};

const server = http.createServer((req, res) => {
  // Normalize URL and remove query string
  const cleanUrl = req.url.split('?')[0].split('#')[0];
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(cleanUrl);
  } catch {
    decodedPath = cleanUrl;
  }

  // Prevent path traversal
  const safePath = path.normalize(decodedPath).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(outDir, safePath);

  // Resolution order for static export:
  // 1. Exact file if exists
  // 2. If directory or /, look for index.html
  // 3. filePath + '.html' (Next.js route convention)
  // 4. Fallback to 404.html or _not-found.html or index.html
  let fileToServe = null;

  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      fileToServe = filePath;
    } else if (stat.isDirectory()) {
      const indexCandidate = path.join(filePath, 'index.html');
      if (fs.existsSync(indexCandidate)) {
        fileToServe = indexCandidate;
      }
    }
  }

  if (!fileToServe) {
    const htmlCandidate = filePath + '.html';
    if (fs.existsSync(htmlCandidate) && fs.statSync(htmlCandidate).isFile()) {
      fileToServe = htmlCandidate;
    }
  }

  let statusCode = 200;
  if (!fileToServe) {
    const notFoundCandidate = path.join(outDir, '_not-found.html');
    const fourOhFourCandidate = path.join(outDir, '404.html');
    if (fs.existsSync(notFoundCandidate)) {
      fileToServe = notFoundCandidate;
      statusCode = 404;
    } else if (fs.existsSync(fourOhFourCandidate)) {
      fileToServe = fourOhFourCandidate;
      statusCode = 404;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
  }

  const ext = path.extname(fileToServe).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Read file and serve
  fs.readFile(fileToServe, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
      return;
    }

    const headers = {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };

    // Cache control
    if (ext === '.html') {
      headers['Cache-Control'] = 'public, max-age=0, must-revalidate';
    } else {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    }

    const acceptEncoding = req.headers['accept-encoding'] || '';
    if (acceptEncoding.includes('gzip') && data.length > 1024) {
      zlib.gzip(data, (gzipErr, compressed) => {
        if (!gzipErr) {
          headers['Content-Encoding'] = 'gzip';
          res.writeHead(statusCode, headers);
          res.end(compressed);
        } else {
          res.writeHead(statusCode, headers);
          res.end(data);
        }
      });
    } else {
      res.writeHead(statusCode, headers);
      res.end(data);
    }
  });
});

server.listen(port, () => {
  console.log(`[Mahi 4K Web] Production server running on http://localhost:${port}`);
  console.log(`[Mahi 4K Web] Serving static assets from: ${outDir}`);
});
