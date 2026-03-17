import fs from "node:fs/promises";

const SUMMARY_PATH = new URL("../coverage/coverage-summary.json", import.meta.url);
const OUT_PATH = new URL("../coverage-badge.svg", import.meta.url);

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function colorFor(pct) {
  if (pct >= 95) return "#2da44e"; // green
  if (pct >= 90) return "#40c463";
  if (pct >= 80) return "#dfb317"; // yellow
  if (pct >= 70) return "#fe7d37"; // orange
  return "#e05d44"; // red
}

function escapeXml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function badgeSvg({ label, message, color }) {
  // Simple, Shields-like SVG (no external deps).
  // Widths are fixed to avoid font measurement complexity.
  const leftWidth = 88;
  const rightWidth = 72;
  const height = 20;
  const width = leftWidth + rightWidth;

  const leftTextX = leftWidth / 2;
  const rightTextX = leftWidth + rightWidth / 2;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" role="img" aria-label="${escapeXml(
    `${label}: ${message}`,
  )}">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${width}" height="${height}" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="${height}" fill="#555"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="${height}" fill="${color}"/>
    <rect width="${width}" height="${height}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${leftTextX}" y="14">${escapeXml(label)}</text>
    <text x="${rightTextX}" y="14">${escapeXml(message)}</text>
  </g>
</svg>
`;
}

let raw;
try {
  raw = await fs.readFile(SUMMARY_PATH, "utf8");
} catch (err) {
  console.error(
    `Could not read coverage summary at ${SUMMARY_PATH.pathname}. Run "npm run test:coverage" first.`,
  );
  throw err;
}

/** @type {{ total?: { lines?: { pct?: number } } }} */
const summary = JSON.parse(raw);
const pctRaw = summary?.total?.lines?.pct;
const pct = clamp(typeof pctRaw === "number" ? pctRaw : 0, 0, 100);

const svg = badgeSvg({
  label: "coverage",
  message: `${pct.toFixed(0)}%`,
  color: colorFor(pct),
});

await fs.writeFile(OUT_PATH, svg, "utf8");
console.log(`Wrote ${OUT_PATH.pathname} (${pct.toFixed(0)}%)`);

