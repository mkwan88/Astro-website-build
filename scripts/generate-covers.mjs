#!/usr/bin/env node
/**
 * Generates branded blog cover images from each post's title: no AI imagery.
 * Run with: node scripts/generate-covers.mjs [--only=slug1,slug2]
 *
 * Covers are 1600x900 PNGs saved to src/assets/covers/<slug>.png. Point a post's `heroImage`
 * at "../../assets/covers/<slug>.png" to use one. Astro converts them to WebP at build time.
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

// Brand tokens, mirrored from src/styles/global.css.
const C = {
  brand950: '#1e1b4b',
  brand900: '#312e81',
  brand800: '#3730a3',
  brand600: '#4f46e5',
  brand300: '#a5b4fc',
  brand200: '#c7d2fe',
  accent400: '#2dd4bf',
  accent300: '#5eead4',
};

const font = (pkg, file) => readFile(path.join(ROOT, 'node_modules', '@fontsource', pkg, 'files', file));
const fonts = [
  { name: 'Manrope', weight: 800, style: 'normal', data: await font('manrope', 'manrope-latin-800-normal.woff') },
  { name: 'Inter', weight: 500, style: 'normal', data: await font('inter', 'inter-latin-500-normal.woff') },
  { name: 'Inter', weight: 600, style: 'normal', data: await font('inter', 'inter-latin-600-normal.woff') },
];

// Same mark as src/components/Logo.astro.
const LOGO_MARK = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="10" fill="${C.brand600}"/><rect x="10" y="8" width="5" height="24" rx="1.5" fill="white"/><path d="M17 20 L30 8" stroke="white" stroke-width="5" stroke-linecap="round"/><path d="M17 20 L30 32" stroke="white" stroke-width="5" stroke-linecap="round"/><circle cx="33" cy="8" r="5" fill="${C.accent400}"/></svg>`
)}`;

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

function cover({ headline, subline, kicker }) {
  // Concentric "signal" rings, echoing the homepage beacon, bleeding off the right edge.
  const rings = [260, 420, 580, 740].map((size, i) =>
    h('div', {
      position: 'absolute',
      width: size,
      height: size,
      right: 160 - size / 2,
      top: 300 - size / 2,
      borderRadius: '50%',
      border: `2px solid ${i === 0 ? C.accent400 : C.brand300}`,
      opacity: i === 0 ? 0.55 : 0.18 - i * 0.03,
    })
  );

  return h(
    'div',
    {
      width: WIDTH,
      height: HEIGHT,
      display: 'flex',
      position: 'relative',
      backgroundImage: `linear-gradient(135deg, ${C.brand950} 0%, ${C.brand900} 60%, ${C.brand800} 100%)`,
      fontFamily: 'Inter',
      overflow: 'hidden',
    },
    rings,
    h('div', {
      position: 'absolute',
      width: 26,
      height: 26,
      right: 147,
      top: 287,
      borderRadius: '50%',
      backgroundColor: C.accent400,
    }),
    h(
      'div',
      {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '96px 110px 88px',
        width: '100%',
        height: '100%',
      },
      h(
        'div',
        { display: 'flex', flexDirection: 'column', maxWidth: 1080 },
        h(
          'div',
          {
            display: 'flex',
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: C.accent300,
          },
          kicker
        ),
        h(
          'div',
          {
            display: 'flex',
            marginTop: 36,
            fontFamily: 'Manrope',
            fontWeight: 800,
            fontSize: headline.length > 34 ? 84 : 96,
            lineHeight: 1.08,
            letterSpacing: -1.5,
            color: 'white',
          },
          headline
        ),
        subline
          ? h('div', { display: 'flex', marginTop: 28, fontSize: 40, fontWeight: 500, lineHeight: 1.3, color: C.brand200 }, subline)
          : []
      ),
      h(
        'div',
        { display: 'flex', alignItems: 'center' },
        { type: 'img', props: { src: LOGO_MARK, width: 56, height: 56 } },
        h('div', { display: 'flex', marginLeft: 18, fontFamily: 'Manrope', fontWeight: 800, fontSize: 34, color: 'white' }, 'Kwantum'),
        h('div', { display: 'flex', marginLeft: 22, width: 2, height: 30, backgroundColor: C.brand300, opacity: 0.4 }),
        h('div', { display: 'flex', marginLeft: 22, fontSize: 28, fontWeight: 500, color: C.brand300 }, 'Mark Kwan · Melbourne')
      )
    ),
    h('div', { position: 'absolute', left: 0, bottom: 0, width: WIDTH, height: 10, backgroundColor: C.accent400 })
  );
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  const only = onlyArg ? new Set(onlyArg.replace('--only=', '').split(',')) : null;

  const files = (await readdir(BLOG_DIR)).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    if (only && !only.has(slug)) continue;

    const src = await readFile(path.join(BLOG_DIR, file), 'utf8');
    const title = JSON.parse(frontmatterValue(src, 'title'));
    const tags = JSON.parse(frontmatterValue(src, 'tags') || '[]');
    const [headline, subline] = splitTitle(title);

    const svg = await satori(cover({ headline, subline, kicker: `Kwantum Blog · ${tags[0] ?? 'Guide'}` }), {
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
