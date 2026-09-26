/**
 * Re-encodes the app icons in public/ to sane sizes.
 * Run with: node scripts/optimize-icons.mjs
 *
 * Why this exists: the icons were exported as 32-bit RGBA PNGs and shipped
 * raw. They don't go through /_next/image (favicons and manifest icons are
 * fetched directly by browsers), so whatever is on disk is exactly what users
 * download — 580 KB of it, against a ~39 KB LCP image on the same page.
 *
 * The logo is flat brand colour plus smooth gradients, which 8-bit palette
 * PNG handles without visible banding (verified at 1:1 on the gradient sweep
 * before this was adopted). That alone is a 70-85% reduction.
 *
 * favicon.svg is a special case: it was never a vector. It is a 512x512 PNG
 * base64-embedded in an SVG wrapper, so it cost 274 KB and scaled no better
 * than a raster. It is rebuilt here around a 192px embed — still valid for the
 * `image/svg+xml` icon entry, and plenty for tab and bookmark rendering, at
 * roughly a twentieth of the size.
 *
 * Re-run this after replacing the source logo.
 */
import { readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const publicDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "public"
);

/** Palette PNG settings — visually lossless for this artwork, far smaller. */
const PNG_OPTS = {
  palette: true,
  quality: 90,
  effort: 10,
  compressionLevel: 9,
};

/** The raster icons, with the size each is declared at. */
const RASTER_ICONS = [
  ["web-app-manifest-512x512.png", 512],
  ["web-app-manifest-192x192.png", 192],
  ["apple-touch-icon.png", 180],
  ["favicon-96x96.png", 96],
];

/** Size of the PNG embedded in favicon.svg. */
const FAVICON_SVG_EMBED_SIZE = 192;

function kb(bytes) {
  return `${Math.round(bytes / 1024)} KB`;
}

async function sizeOf(file) {
  return (await stat(file)).size;
}

/** Pull the base64 PNG back out of the pseudo-SVG favicon. */
async function extractEmbeddedPng(svgPath) {
  const svg = await readFile(svgPath, "utf8");
  const match = svg.match(/base64,([A-Za-z0-9+/=]+)/);
  if (!match) return null;
  return Buffer.from(match[1], "base64");
}

async function main() {
  let before = 0;
  let after = 0;

  for (const [name, size] of RASTER_ICONS) {
    const file = path.join(publicDir, name);
    const originalSize = await sizeOf(file);
    const out = await sharp(file)
      .resize(size, size, { fit: "cover" })
      .png(PNG_OPTS)
      .toBuffer();

    if (out.length >= originalSize) {
      console.log(`${name.padEnd(32)} ${kb(originalSize)} — already optimal, skipped`);
      before += originalSize;
      after += originalSize;
      continue;
    }

    await writeFile(file, out);
    before += originalSize;
    after += out.length;
    console.log(
      `${name.padEnd(32)} ${kb(originalSize)} -> ${kb(out.length)}  (${Math.round(
        (1 - out.length / originalSize) * 100
      )}% smaller)`
    );
  }

  // favicon.svg — rebuild the wrapper around a much smaller embed.
  const svgPath = path.join(publicDir, "favicon.svg");
  const embedded = await extractEmbeddedPng(svgPath);
  if (embedded) {
    const originalSize = await sizeOf(svgPath);
    const png = await sharp(embedded)
      .resize(FAVICON_SVG_EMBED_SIZE, FAVICON_SVG_EMBED_SIZE, { fit: "cover" })
      .png(PNG_OPTS)
      .toBuffer();

    // viewBox stays 512 so the icon still scales to any requested size.
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
      `width="512" height="512" viewBox="0 0 512 512">` +
      `<image width="512" height="512" xlink:href="data:image/png;base64,${png.toString(
        "base64"
      )}"/>` +
      `</svg>`;

    await writeFile(svgPath, svg, "utf8");
    before += originalSize;
    after += Buffer.byteLength(svg);
    console.log(
      `${"favicon.svg".padEnd(32)} ${kb(originalSize)} -> ${kb(
        Buffer.byteLength(svg)
      )}  (${Math.round((1 - Buffer.byteLength(svg) / originalSize) * 100)}% smaller)`
    );
  }

  console.log(
    `\nTotal: ${kb(before)} -> ${kb(after)}  (${Math.round(
      (1 - after / before) * 100
    )}% smaller, ${kb(before - after)} saved per cold visit)`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
