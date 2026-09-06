/**
 * One-off generator for placeholder PWA icons.
 * Run with: node scripts/generate-icons.mjs
 *
 * Produces a simple tic-tac-toe-grid mark in the app's existing brand
 * colors (dark surface, purple grid, cyan X, pink O) as a stand-in until
 * a real logo is supplied - swap the files under public/icons/ and
 * public/apple-touch-icon.png at that point, no other wiring needed.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const BG = "#0f0f14";
const GRID = "#8b5cf6";
const X_COLOR = "#00d4ff";
const O_COLOR = "#ff6b9d";

/**
 * Build the icon as an SVG string.
 * @param {number} size - canvas size in px (square)
 * @param {number} paddingRatio - fraction of size kept clear on each edge
 *   (0 for a tightly-cropped "any" icon, ~0.2 for a "maskable" safe zone)
 */
function buildSvg(size, paddingRatio) {
  const pad = size * paddingRatio;
  const gridSize = size - pad * 2;
  const cell = gridSize / 3;
  const x0 = pad;
  const stroke = Math.max(4, size * 0.03);
  const markStroke = Math.max(4, size * 0.045);

  const gridLines = [
    // vertical
    `<line x1="${x0 + cell}" y1="${x0}" x2="${x0 + cell}" y2="${x0 + gridSize}" />`,
    `<line x1="${x0 + cell * 2}" y1="${x0}" x2="${x0 + cell * 2}" y2="${x0 + gridSize}" />`,
    // horizontal
    `<line x1="${x0}" y1="${x0 + cell}" x2="${x0 + gridSize}" y2="${x0 + cell}" />`,
    `<line x1="${x0}" y1="${x0 + cell * 2}" x2="${x0 + gridSize}" y2="${x0 + cell * 2}" />`,
  ].join("");

  // X in the top-left cell
  const xPad = cell * 0.28;
  const xCx = x0;
  const xCy = x0;
  const xMark = `
    <line x1="${xCx + xPad}" y1="${xCy + xPad}" x2="${xCx + cell - xPad}" y2="${xCy + cell - xPad}" stroke="${X_COLOR}" stroke-width="${markStroke}" stroke-linecap="round" />
    <line x1="${xCx + cell - xPad}" y1="${xCy + xPad}" x2="${xCx + xPad}" y2="${xCy + cell - xPad}" stroke="${X_COLOR}" stroke-width="${markStroke}" stroke-linecap="round" />
  `;

  // O in the bottom-right cell
  const oCx = x0 + cell * 2 + cell / 2;
  const oCy = x0 + cell * 2 + cell / 2;
  const oR = cell * 0.32;
  const oMark = `<circle cx="${oCx}" cy="${oCy}" r="${oR}" fill="none" stroke="${O_COLOR}" stroke-width="${markStroke}" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${BG}" />
    <g stroke="${GRID}" stroke-width="${stroke}" stroke-linecap="round">${gridLines}</g>
    ${xMark}
    ${oMark}
  </svg>`;
}

async function renderPng(svg, size, outPath) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(outPath);
  console.log(`wrote ${outPath}`);
}

async function main() {
  const publicDir = path.resolve(import.meta.dirname, "..", "public");
  const iconsDir = path.join(publicDir, "icons");
  await mkdir(iconsDir, { recursive: true });

  const anySvg = buildSvg(512, 0.06);
  const maskableSvg = buildSvg(512, 0.2);

  await writeFile(path.join(iconsDir, "icon.svg"), anySvg, "utf8");

  await renderPng(anySvg, 192, path.join(iconsDir, "icon-192.png"));
  await renderPng(anySvg, 512, path.join(iconsDir, "icon-512.png"));
  await renderPng(maskableSvg, 512, path.join(iconsDir, "icon-maskable-512.png"));
  await renderPng(buildSvg(180, 0.08), 180, path.join(publicDir, "apple-touch-icon.png"));
  await renderPng(buildSvg(32, 0), 32, path.join(publicDir, "favicon-32.png"));
  await renderPng(buildSvg(16, 0), 16, path.join(publicDir, "favicon-16.png"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
