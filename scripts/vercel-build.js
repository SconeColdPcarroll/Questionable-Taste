const fs = require('fs');
const path = require('path');

const src = path.resolve(process.cwd(), 'apps/web');
const dest = path.resolve(process.cwd(), 'public');

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (!fs.existsSync(src)) {
  throw new Error(`Missing source directory: ${src}`);
}

fs.rmSync(dest, { recursive: true, force: true });
copyDir(src, dest);

console.log(`Prepared Vercel output directory: ${dest}`);
