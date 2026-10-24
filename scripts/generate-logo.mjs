#!/usr/bin/env node
/**
 * Generates the Kwantum logo files ("signal sticker", option E, chosen October 2026).
 * Run with: node scripts/generate-logo.mjs
 *
 * Mark: the K on a yellow sticker tile with a hard ink shadow, plus a coral dot with a signal
 * ring in the top-right corner. Tilted for the website and social; upright where a tilt can look
 * accidental (Google Business Profile, favicon, invoices). On dark backgrounds the ring is cream.
 *
 * Outputs
 *   brand/logo/   SVG + PNG marks and lockups, Google Business Profile squares
 *   public/       brand-mark.svg, favicon.svg, favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png
 *
 * The wordmark is Bricolage Grotesque ExtraBold, converted to outlines so the SVGs don't depend
 * on the font being installed.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { COLORS, markBody } from './lib/logo-mark.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BRAND = path.join(ROOT, 'brand', 'logo');
const PUBLIC = path.join(ROOT, 'public');

const C = COLORS;

const wrap = (body, vb, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}"${extra}>${body}</svg>`;

/** Tight viewBox around rendered content, with a little padding. */
function tightBox(body, pad = 0.6) {
  const probe = new Resvg(wrap(body, { x: -20, y: -20, w: 100, h: 100 }));
  const b = probe.getBBox();
  // getBBox returns user-space units of the probe viewBox
  return { x: +(b.x - pad).toFixed(2), y: +(b.y - pad).toFixed(2), w: +(b.width + pad * 2).toFixed(2), h: +(b.height + pad * 2).toFixed(2) };
}

const png = (svg, width, background) =>
  new Resvg(svg, { fitTo: { mode: 'width', value: width }, ...(background ? { background } : {}) }).render().asPng();

async function wordmarkPaths(color) {
  const font = await readFile(path.join(ROOT, 'node_modules', '@fontsource', 'bricolage-grotesque', 'files', 'bricolage-grotesque-latin-800-normal.woff'));
  const svg = await satori(
    { type: 'div', props: { style: { display: 'flex', fontFamily: 'Bricolage', fontWeight: 800, fontSize: 100, letterSpacing: -2, color, lineHeight: 1 }, children: 'Kwantum' } },
    { width: 520, height: 130, fonts: [{ name: 'Bricolage', weight: 800, style: 'normal', data: font }] }
  );
  const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const b = new Resvg(svg).getBBox();
  return { inner, box: { x: b.x, y: b.y, w: b.width, h: b.height } };
}

async function lockup({ tilt, ring, text }) {
  const body = markBody({ tilt, ring });
  const mb = tightBox(body, 0);
  const word = await wordmarkPaths(text);
  // Scale the mark so its tile is a little taller than the wordmark's cap height.
  const markH = word.box.h * 1.55;
  const s = markH / mb.h;
  const gap = word.box.h * 0.38;
  const markW = mb.w * s;
  const height = Math.max(markH, word.box.h);
  const wordX = markW + gap - word.box.x;
  const wordY = (height - word.box.h) / 2 - word.box.y;
  const totalW = markW + gap + word.box.w;
  const content =
    `<g transform="translate(${(-mb.x * s).toFixed(2)} ${((height - markH) / 2 - mb.y * s).toFixed(2)}) scale(${s.toFixed(4)})">${body}</g>` +
    `<g transform="translate(${wordX.toFixed(2)} ${wordY.toFixed(2)})">${word.inner}</g>`;
  const pad = height * 0.06;
  return wrap(content, { x: +(-pad).toFixed(2), y: +(-pad).toFixed(2), w: +(totalW + pad * 2).toFixed(2), h: +(height + pad * 2).toFixed(2) });
}

/** Upright mark centred on a solid square, for profile pictures that get cropped to a circle. */
function square(bg, ring = C.ink) {
  const body = markBody({ tilt: 0, ring });
  const b = tightBox(body, 0);
  const size = Math.max(b.w, b.h) / 0.62; // mark fills ~62% so a circle crop never clips it
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  return wrap(`<rect x="${cx - size / 2}" y="${cy - size / 2}" width="${size}" height="${size}" fill="${bg}"/>${body}`, { x: cx - size / 2, y: cy - size / 2, w: size, h: size });
}

async function main() {
  await mkdir(BRAND, { recursive: true });
  const out = [];
  const save = async (dir, name, data) => {
    await writeFile(path.join(dir, name), data);
    out.push(path.relative(ROOT, path.join(dir, name)));
  };

  // Marks
  for (const [name, opts] of [
    ['kwantum-mark', { tilt: -7, ring: C.ink }],
    ['kwantum-mark-dark', { tilt: -7, ring: C.cream }],
    ['kwantum-mark-upright', { tilt: 0, ring: C.ink }],
    ['kwantum-mark-upright-dark', { tilt: 0, ring: C.cream }],
  ]) {
    const body = markBody(opts);
    const svg = wrap(body, tightBox(body));
    await save(BRAND, `${name}.svg`, svg);
    await save(BRAND, `${name}.png`, png(svg, 1024));
    if (name === 'kwantum-mark') await save(PUBLIC, 'brand-mark.svg', svg); // used by the site header
  }

  // Lockups (mark + wordmark)
  for (const [name, opts] of [
    ['kwantum-logo', { tilt: -7, ring: C.ink, text: C.ink }],
    ['kwantum-logo-dark', { tilt: -7, ring: C.cream, text: C.white }],
  ]) {
    const svg = await lockup(opts);
    await save(BRAND, `${name}.svg`, svg);
    await save(BRAND, `${name}.png`, png(svg, 2000));
  }

  // Google Business Profile / social avatars (1024 square, circle-safe)
  await save(BRAND, 'kwantum-gbp-cream.png', png(square(C.cream), 1024));
  await save(BRAND, 'kwantum-gbp-white.png', png(square(C.white), 1024));
  await save(BRAND, 'kwantum-gbp-ink.png', png(square(C.ink, C.cream), 1024));

  // Favicons: upright mark; the SVG favicon switches the ring to cream in dark browser chrome.
  const fav = markBody({ tilt: 0, ring: 'var(--ring)' });
  const favBox = tightBox(markBody({ tilt: 0 }));
  const favSvg = wrap(
    `<style>:root{--ring:${C.ink}}@media (prefers-color-scheme:dark){:root{--ring:${C.cream}}}</style>${fav}`,
    favBox
  );
  await save(PUBLIC, 'favicon.svg', favSvg);

  const uprightSvg = wrap(markBody({ tilt: 0 }), favBox);
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(sizes.map((s) => sharp(png(uprightSvg, s * 4)).resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()));
  await save(PUBLIC, 'favicon.ico', toIco(pngs, sizes));

  const touch = png(square(C.cream), 180);
  await save(PUBLIC, 'apple-touch-icon.png', touch);
  await save(PUBLIC, 'icon-192.png', png(square(C.cream), 192));
  await save(PUBLIC, 'icon-512.png', png(square(C.cream), 512));

  console.log(out.map((f) => `✓ ${f}`).join('\n'));
}

/** Packs PNG images into a .ico container (PNG-compressed entries, supported by all modern browsers). */
function toIco(images, sizes) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const dir = Buffer.alloc(16 * images.length);
  let offset = 6 + dir.length;
  images.forEach((img, i) => {
    const s = sizes[i];
    dir.writeUInt8(s >= 256 ? 0 : s, i * 16);
    dir.writeUInt8(s >= 256 ? 0 : s, i * 16 + 1);
    dir.writeUInt8(0, i * 16 + 2);
    dir.writeUInt8(0, i * 16 + 3);
    dir.writeUInt16LE(1, i * 16 + 4);
    dir.writeUInt16LE(32, i * 16 + 6);
    dir.writeUInt32LE(img.length, i * 16 + 8);
    dir.writeUInt32LE(offset, i * 16 + 12);
    offset += img.length;
  });
  return Buffer.concat([header, dir, ...images]);
}

main();
