// Generates Nearo PWA PNG icons without any native image dependencies.
// Run: node scripts/generate-icons.cjs
const { PNG } = require("pngjs");
const fs = require("fs");
const path = require("path");

const BG = [10, 10, 10]; // #0a0a0a
const FG = [250, 250, 250]; // #fafafa
const ACCENT = [78, 163, 255]; // #4ea3ff

function insideRoundedRect(x, y, rx, ry, rw, rh, radius) {
  if (x < rx || y < ry || x > rx + rw || y > ry + rh) return false;
  const cx = Math.max(rx + radius, Math.min(x, rx + rw - radius));
  const cy = Math.max(ry + radius, Math.min(y, ry + rh - radius));
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

// Quadratic bezier point at t for points p0,p1,p2 (in 32-unit space).
function qPoint(t, p0, p1, p2) {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

function render(size, maskable) {
  const png = new PNG({ width: size, height: size });
  const S = size / 32; // design grid 32x32
  const pad = maskable ? 6 : 0; // safe-zone padding for maskable icons
  const sw = 2.5 * S; // stroke width of the link

  // Pre-sample the bezier path (12,20)->(16,20)->(20,12) in grid units.
  const p0 = { x: 12, y: 20 };
  const p1 = { x: 16, y: 20 };
  const p2 = { x: 20, y: 12 };
  const samples = [];
  for (let i = 0; i <= 96; i++) {
    samples.push(qPoint(i / 96, p0, p1, p2));
  }

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const gx = (px + 0.5) / S; // grid coords (continuous)
      const gy = (py + 0.5) / S;
      const gx2 = maskable ? gx - pad / 32 * (32 / 32) : gx;
      const gy2 = maskable ? gy - pad / 32 * (32 / 32) : gy;

      let color = BG;
      let alpha = 255;

      // Device A (top-left), Device B (bottom-right, 45%)
      const shrink = maskable ? 0.82 : 1; // scale geometry into the safe zone
      const gxA = maskable ? 16 + (gx - 16) / shrink : gx;
      const gyA = maskable ? 16 + (gy - 16) / shrink : gy;

      if (insideRoundedRect(gxA, gyA, 5, 5, 10, 10, 3)) {
        color = FG;
      } else if (insideRoundedRect(gxA, gyA, 17, 17, 10, 10, 3)) {
        color = [
          Math.round(0.45 * FG[0] + 0.55 * BG[0]),
          Math.round(0.45 * FG[1] + 0.55 * BG[1]),
          Math.round(0.45 * FG[2] + 0.55 * BG[2]),
        ];
      } else {
        // Link arc: distance to nearest bezier sample.
        let dist = Infinity;
        for (const s of samples) {
          const dx = gxA - s.x;
          const dy = gyA - s.y;
          const d = dx * dx + dy * dy;
          if (d < dist) dist = d;
        }
        if (dist <= (sw / 2 / S) * (sw / 2 / S)) {
          color = ACCENT;
        }
      }

      const idx = (size * py + px) << 2;
      png.data[idx] = color[0];
      png.data[idx + 1] = color[1];
      png.data[idx + 2] = color[2];
      png.data[idx + 3] = alpha;
      void pad; void gx2; void gy2;
    }
  }
  return PNG.sync.write(png);
}

const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });
for (const [name, size, maskable] of [
  ["icon-192.png", 192, false],
  ["icon-512.png", 512, false],
  ["icon-maskable-192.png", 192, true],
  ["icon-maskable-512.png", 512, true],
]) {
  fs.writeFileSync(path.join(outDir, name), render(size, maskable));
  console.log("wrote", name);
}
