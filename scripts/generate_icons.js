const fs = require('fs');
const path = require('path');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="128" fill="#0F172A"/>
  <circle cx="256" cy="256" r="160" fill="none" stroke="#FF4B00" stroke-width="32"/>
  <path d="M 256 140 L 320 280 L 192 280 Z" fill="#FF4B00"/>
  <circle cx="256" cy="340" r="24" fill="#FF4B00"/>
</svg>`;

const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent);

try {
  const sharp = require('sharp');
  const svgBuffer = Buffer.from(svgContent);

  Promise.all([
    sharp(svgBuffer).resize(192, 192).toFile(path.join(iconsDir, 'icon-192.png')),
    sharp(svgBuffer).resize(512, 512).toFile(path.join(iconsDir, 'icon-512.png')),
    sharp(svgBuffer).resize(512, 512).toFile(path.join(iconsDir, 'icon-512-maskable.png')),
    sharp(svgBuffer).resize(180, 180).toFile(path.join(iconsDir, 'apple-touch-icon.png')),
  ]).then(() => console.log("PWA Icons generated successfully!"));
} catch (e) {
  console.log("Sharp not installed yet, SVG written.");
}
