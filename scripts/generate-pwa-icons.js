import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';

function createIcon(size, isMaskable = false) {
  const png = new PNG({ width: size, height: size });

  const bgR = 0x0b, bgG = 0x13, bgB = 0x2b; // #0b132b Navy
  const ringR = 0x10, ringG = 0xb9, ringB = 0x81; // #10b981 Emerald
  const accentR = 0xd9, accentG = 0x26, accentB = 0x26; // #d92626 Red
  const whiteR = 0xff, whiteG = 0xff, whiteB = 0xff;

  const center = size / 2;
  const outerRadius = isMaskable ? size * 0.40 : size * 0.44;
  const innerRadius = outerRadius * 0.65;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default background: #0b132b
      let r = bgR, g = bgG, b = bgB, a = 255;

      // Draw outer circle container with subtle border
      if (dist <= outerRadius) {
        if (dist >= outerRadius - 4) {
          // Ring border (Emerald)
          r = ringR; g = ringG; b = ringB;
        } else if (dist <= innerRadius) {
          // Inner core (White)
          r = whiteR; g = whiteG; b = whiteB;
        } else {
          // Middle Aperture Band (Navy blue)
          r = 0x0a; g = 0x25; b = 0x40;
        }
      }

      // Draw central Maple Leaf silhouette (approximate shape in inner core)
      if (dist < innerRadius * 0.75) {
        const ny = dy / innerRadius;
        const nx = Math.abs(dx) / innerRadius;

        // Simple central maple leaf geometry
        const leafBody = (ny > -0.65 && ny < 0.35 && nx < 0.15) ||
                         (ny > -0.45 && ny < 0.15 && nx < 0.45) ||
                         (ny > -0.15 && ny < 0.35 && nx < 0.25) ||
                         (ny >= 0.35 && ny <= 0.55 && nx < 0.05); // stem

        if (leafBody) {
          r = 0x0a; g = 0x25; b = 0x40; // Navy leaf on white core
        }
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }

  return png;
}

const publicDir = path.resolve(process.cwd(), 'public');

const sizes = [
  { filename: 'pwa-192x192.png', size: 192, maskable: false },
  { filename: 'pwa-512x512.png', size: 512, maskable: false },
  { filename: 'pwa-maskable-512x512.png', size: 512, maskable: true },
  { filename: 'apple-touch-icon.png', size: 180, maskable: false }
];

sizes.forEach(({ filename, size, maskable }) => {
  const icon = createIcon(size, maskable);
  const filePath = path.join(publicDir, filename);
  icon.pack().pipe(fs.createWriteStream(filePath)).on('finish', () => {
    console.log(`Generated ${filename} (${size}x${size})`);
  });
});
