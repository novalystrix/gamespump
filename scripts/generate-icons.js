const fs = require('fs');
const path = require('path');

const svg192 = `<svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
  </defs>
  <rect width="192" height="192" rx="40" fill="url(#bg)"/>
  <text x="96" y="120" text-anchor="middle" font-family="system-ui" font-weight="800" font-size="72" fill="white">GP</text>
</svg>`;

const svg512 = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="106" fill="url(#bg)"/>
  <text x="256" y="320" text-anchor="middle" font-family="system-ui" font-weight="800" font-size="192" fill="white">GP</text>
</svg>`;

fs.writeFileSync(path.join(__dirname, '../public/icon-192.svg'), svg192);
fs.writeFileSync(path.join(__dirname, '../public/icon-512.svg'), svg512);
console.log('SVG icons generated');
