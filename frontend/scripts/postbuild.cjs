const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, '..');
const distDir = path.join(frontendDir, 'dist');
const distClientDir = path.join(distDir, 'client');
const assetsDir = path.join(distClientDir, 'assets');
const indexHtmlSrc = path.join(frontendDir, 'index.html');

// 1. Ensure dist and dist/client exist
fs.mkdirSync(distDir, { recursive: true });
fs.mkdirSync(distClientDir, { recursive: true });

// 2. Find compiled JS and CSS files in assets
let indexJsFile = null;
let stylesCssFile = null;

if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  indexJsFile = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
  stylesCssFile = files.find(f => f.startsWith('styles-') && f.endsWith('.css'));
}

console.log('Found bundled assets:', { indexJsFile, stylesCssFile });

// 3. Read template index.html
let htmlContent = fs.readFileSync(indexHtmlSrc, 'utf-8');

// Build script and css tags
let headTags = '';
if (stylesCssFile) {
  headTags += `\n    <link rel="stylesheet" href="/assets/${stylesCssFile}">`;
}

let bodyTags = '';
if (indexJsFile) {
  bodyTags = `<script type="module" src="/assets/${indexJsFile}"></script>`;
}

// Inject headTags before </head> and replace /src/start.ts
htmlContent = htmlContent.replace('</head>', `${headTags}\n  </head>`);
htmlContent = htmlContent.replace('<script type="module" src="/src/start.ts"></script>', bodyTags);

// 4. Write compiled index.html to dist/index.html and dist/client/index.html
fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);
fs.writeFileSync(path.join(distClientDir, 'index.html'), htmlContent);

// 5. Copy all dist/client assets to dist root
if (fs.existsSync(distClientDir)) {
  fs.cpSync(distClientDir, distDir, { recursive: true });
}

console.log('Postbuild completed: Compiled index.html with JS/CSS assets synchronized to dist/ and dist/client/');
