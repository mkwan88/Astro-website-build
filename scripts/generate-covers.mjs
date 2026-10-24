#!/usr/bin/env node
/**
 * Generates branded blog cover images from each post's title: no AI imagery.
 * Run with: node scripts/generate-covers.mjs [--only=slug1,slug2]
 *
 * Covers are 1600x900 PNGs saved to src/assets/covers/<slug>.png. Point a post's `heroImage`
 * at "../../assets/covers/<slug>.png" to use one. Astro converts them to WebP at build time.
 *
 * Style follows the "playful local" direction: warm flat colours, Bricolage Grotesque headlines,
 * a teal map pin with signal rings, no gradients. Colour schemes rotate in publish order (oldest
 * first), so neighbouring posts differ and adding a new post never changes an older cover.
 *
 * Title split: a trailing "(…)" or the text after a "?" becomes the smaller second line, e.g.
 * "How Much Does SEO Cost in Australia? (Honest Numbers)" -> headline + "Honest Numbers".
 */
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'src', 'content', 'blog');
const OUT_DIR = path.join(ROOT, 'src', 'assets', 'covers');

const WIDTH = 1600;
const HEIGHT = 900;

// Palette from the playful-local mock-up (src/pages/mockups/playful.astro).
const C = {
  ink: '#1E1B4B',
  indigo: '#4F46E5',
  cream: '#FBF6EC',
  yellow: '#FFCB47',
  teal: '#2DD4BF',
  coral: '#FF8A65',
  lilac: '#A5B4FC',
};

// bg = card colour, text = headline colour, pin/ring = decoration colours, tag = kicker pill.
const SCHEMES = [
  { bg: C.yellow, text: C.ink, sub: C.ink, pin: C.ink, dot: C.yellow, ring: C.ink, tagBg: C.ink, tagText: C.yellow },
  { bg: C.teal, text: C.ink, sub: C.ink, pin: C.ink, dot: C.teal, ring: C.ink, tagBg: C.cream, tagText: C.ink },
  { bg: C.indigo, text: '#FFFFFF', sub: '#E0E7FF', pin: C.teal, dot: C.ink, ring: C.yellow, tagBg: C.yellow, tagText: C.ink },
  { bg: C.coral, text: C.ink, sub: C.ink, pin: C.ink, dot: C.coral, ring: C.cream, tagBg: C.cream, tagText: C.ink },
  { bg: C.cream, text: C.ink, sub: C.ink, pin: C.teal, dot: C.ink, ring: C.indigo, tagBg: C.teal, tagText: C.ink },
];

const font = (pkg, file) => readFile(path.join(ROOT, 'node_modules', '@fontsource', pkg, 'files', file));
const fonts = [
  { name: 'Bricolage', weight: 800, style: 'normal', data: await font('bricolage-grotesque', 'bricolage-grotesque-latin-800-normal.woff') },
  { name: 'Bricolage', weight: 700, style: 'normal', data: await font('bricolage-grotesque', 'bricolage-grotesque-latin-700-normal.woff') },
  { name: 'Inter', weight: 500, style: 'normal', data: await font('inter', 'inter-latin-500-normal.woff') },
  { name: 'Inter', weight: 600, style: 'normal', data: await font('inter', 'inter-latin-600-normal.woff') },
];

const svgUri = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

// Same mark as src/components/Logo.astro.
const LOGO_MARK = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="10" fill="${C.ink}"/><rect x="10" y="8" width="5" height="24" rx="1.5" fill="white"/><path d="M17 20 L30 8" stroke="white" stroke-width="5" stroke-linecap="round"/><path d="M17 20 L30 32" stroke="white" stroke-width="5" stroke-linecap="round"/><circle cx="33" cy="8" r="5" fill="${C.teal}"/></svg>`
);

// Map pin with signal rings, drawn flat. Sits in the bottom-right corner, partly off the edge.
const pinArt = (s) =>
  svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
    <g fill="none" stroke="${s.ring}" stroke-width="14">
      <circle cx="300" cy="330" r="150" opacity="0.55"/>
      <circle cx="300" cy="330" r="225" opacity="0.32"/>
      <circle cx="300" cy="330" r="300" opacity="0.18"/>
    </g>
    <path d="M300 170 C245 170 205 210 205 265 C205 335 300 415 300 415 C300 415 395 335 395 265 C395 210 355 170 300 170 Z" fill="${s.pin}"/>
    <circle cx="300" cy="262" r="36" fill="${s.dot}"/>
  </svg>`);

/** Minimal element helper so we don't need JSX. */
const h = (type, style, ...children) => ({ type, props: { style: { display: 'flex', ...style }, children: children.flat() } });

function splitTitle(title) {
  const paren = title.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (paren) return [paren[1], paren[2]];
  const q = title.indexOf('? ');
  if (q !== -1) return [title.slice(0, q + 1), title.slice(q + 2)];
  return [title, ''];
}

function frontmatterValue(src, key) {
  const m = src.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return m ? m[1].trim() : '';
}

function cover({ headline, subline, kicker, s }) {
  return h(
    'div',
    { width: WIDTH, height: HEIGHT, position: 'relative', backgroundColor: s.bg, fontFamily: 'Inter', overflow: 'hidden' },
    { type: 'img', props: { src: pinArt(s), width: 760, height: 760, style: { position: 'absolute', right: -170, bottom: -210 } } },
    // small confetti shapes
    h('div', { position: 'absolute', right: 520, top: 110, width: 34, height: 34, borderRadius: 999, backgroundColor: s.ring, opacity: 0.35 }),
    h('div', { position: 'absolute', right: 120, top: 150, width: 46, height: 46, borderRadius: 12, backgroundColor: s.tagBg, transform: 'rotate(18deg)' }),
    h(
      'div',
      { flexDirection: 'column', justifyContent: 'space-between', padding: '90px 104px 84px', width: '100%', height: '100%' },
      h(
        'div',
        { flexDirection: 'column', maxWidth: 1040 },
        h(
          'div',
          { alignSelf: 'flex-start', padding: '12px 26px', borderRadius: 999, backgroundColor: s.tagBg, color: s.tagText, fontSize: 28, fontWeight: 600 },
          kicker
        ),
        h(
          'div',
          {
            marginTop: 40,
            fontFamily: 'Bricolage',
            fontWeight: 800,
            fontSize: headline.length > 34 ? 92 : 104,
            lineHeight: 1.0,
            letterSpacing: -2,
            color: s.text,
          },
          headline
        ),
        subline
          ? h('div', { marginTop: 30, fontFamily: 'Bricolage', fontWeight: 700, fontSize: 44, lineHeight: 1.2, color: s.sub, opacity: 0.85 }, subline)
          : []
      ),
      h(
        'div',
        { alignItems: 'center' },
        { type: 'img', props: { src: LOGO_MARK, width: 58, height: 58 } },
        h('div', { marginLeft: 18, fontFamily: 'Bricolage', fontWeight: 800, fontSize: 36, color: s.text }, 'Kwantum'),
        h('div', { marginLeft: 22, fontSize: 28, fontWeight: 500, color: s.sub, opacity: 0.75 }, 'Mark Kwan · Melbourne')
      )
    )
  );
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  const only = onlyArg ? new Set(onlyArg.replace('--only=', '').split(',')) : null;

  const files = (await readdir(BLOG_DIR)).filter((f) => f.endsWith('.md'));
  const posts = await Promise.all(
    files.map(async (file) => {
      const src = await readFile(path.join(BLOG_DIR, file), 'utf8');
      return { slug: file.replace(/\.md$/, ''), src, date: frontmatterValue(src, 'publishDate') };
    })
  );
  posts.sort((a, b) => a.date.localeCompare(b.date) || a.slug.localeCompare(b.slug));

  for (const [index, { slug, src }] of posts.entries()) {
    if (only && !only.has(slug)) continue;
    const title = JSON.parse(frontmatterValue(src, 'title'));
    const tags = JSON.parse(frontmatterValue(src, 'tags') || '[]');
    const [headline, subline] = splitTitle(title);

    const svg = await satori(cover({ headline, subline, kicker: tags[0] ?? 'Guide', s: SCHEMES[index % SCHEMES.length] }), {
      width: WIDTH,
      height: HEIGHT,
      fonts,
    });
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();
    const outPath = path.join(OUT_DIR, `${slug}.png`);
    await writeFile(outPath, png);
    console.log(`✓ ${slug} -> ${path.relative(ROOT, outPath)} (${png.length} bytes)`);
  }
}

main();
