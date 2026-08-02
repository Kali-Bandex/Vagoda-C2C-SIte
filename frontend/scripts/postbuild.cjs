const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, '..');
const distDir = path.join(frontendDir, 'dist');
const distClientDir = path.join(distDir, 'client');
const indexHtmlSrc = path.join(frontendDir, 'index.html');

// 1. Ensure dist and dist/client exist
fs.mkdirSync(distDir, { recursive: true });
fs.mkdirSync(distClientDir, { recursive: true });

// 2. Copy index.html to dist/index.html and dist/client/index.html
if (fs.existsSync(indexHtmlSrc)) {
  fs.copyFileSync(indexHtmlSrc, path.join(distDir, 'index.html'));
  fs.copyFileSync(indexHtmlSrc, path.join(distClientDir, 'index.html'));
}

// 3. Copy dist/client contents into dist/ root
if (fs.existsSync(distClientDir)) {
  fs.cpSync(distClientDir, distDir, { recursive: true });
}

console.log('Postbuild completed: index.html and client assets synchronized to dist/ and dist/client/');
