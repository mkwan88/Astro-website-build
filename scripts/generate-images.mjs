#!/usr/bin/env node
/**
 * Generates Kwantum's on-brand imagery via the Gemini API ("Nano Banana" / "Nano Banana Pro").
 * Requires GEMINI_API_KEY in the environment. Run with: node scripts/generate-images.mjs [--only=slug1,slug2]
 *
 * Images are saved as PNG into src/assets/generated/ — Astro's <Image> component converts
 * to WebP automatically at build time, so no manual conversion step is needed here.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'src', 'assets', 'generated');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('GEMINI_API_KEY is not set in the environment. Aborting.');
  process.exit(1);
}

// Shared style prefix keeps every generated image on the same brand system.
// See "Kwantum Brand Guidelines.md" > Imagery Style for the source of truth.
const STYLE = `Modern flat-vector illustration, minimalist geometric shapes, soft subtle gradients,
brand color palette of deep indigo (#4F46E5, #312E81) and teal (#14B8A6), on a clean white or
very light background. Confident, tech-forward, professional SaaS/agency aesthetic. No text,
no words, no logos, no watermarks, no human faces rendered as fake real photos — abstract or
stylised only.`;

/** @type {{ slug: string, model: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview', prompt: string }[]} */
const IMAGES = [
  {
    slug: 'home-hero-visibility',
    model: 'gemini-3-pro-image-preview',
    prompt: `${STYLE}\nA hero illustration for a local-SEO and website agency's homepage: an abstract
composition showing a stylised map pin rising above a skyline of simple geometric buildings, with
a subtle upward-trending line graph and small search/ranking icons (magnifying glass, chat bubble,
star) orbiting it, suggesting visibility, growth, and being found online. Wide 16:9 composition
with generous negative space on the left third for text overlay.`,
  },
  {
    slug: 'service-local-seo-hero',
    model: 'gemini-3-pro-image-preview',
    prompt: `${STYLE}\nAn illustration representing local SEO: a stylised map with a glowing map pin
at the centre, surrounded by concentric radiating rings (like a local search radius), small
storefront icon at the pin location, and a subtle star-rating icon nearby. Wide 16:9 composition
with negative space on the right third.`,
  },
  {
    slug: 'service-website-design-hero',
    model: 'gemini-3-pro-image-preview',
    prompt: `${STYLE}\nAn illustration representing modern website design and development: a
stylised browser window / device frame containing simple abstract layout blocks (hero section,
grid of cards, button), floating design tool icons (cursor, layers, grid) around it, conveying a
clean, fast, modern website being assembled. Wide 16:9 composition with negative space on the
right third.`,
  },
  {
    slug: 'service-ai-visibility-hero',
    model: 'gemini-3-pro-image-preview',
    prompt: `${STYLE}\nAn illustration representing AI search visibility (being recommended by AI
assistants): an abstract chat/assistant bubble with a subtle spark/star icon inside, connected by
thin lines to a small stylised storefront/business icon, suggesting an AI recommending a business.
Include soft neural-network-like node-and-line accents in the background. Wide 16:9 composition
with negative space on the right third.`,
  },
  {
    slug: 'area-melbourne-hero',
    model: 'gemini-3-pro-image-preview',
    prompt: `${STYLE}\nA stylised, simplified illustration of the Melbourne, Australia skyline
(recognisable silhouettes reminiscent of Eureka Tower and the general CBD skyline shape, rendered
abstractly, not photorealistic) at dusk, with a soft gradient sky, and a subtle glowing map pin
in front of the skyline. Wide 16:9 composition with negative space at the top for text overlay.`,
  },
  {
    slug: 'area-example-template-hero',
    model: 'gemini-2.5-flash-image',
    prompt: `${STYLE}\nA deliberately generic, simplified illustration of a small city skyline made
of plain geometric building shapes (no recognisable real landmarks), with a soft gradient sky and
a glowing map pin in front, representing a placeholder/template city. Wide 16:9 composition with
negative space at the top for text overlay.`,
  },
  {
    slug: 'case-study-growth-chart',
    model: 'gemini-2.5-flash-image',
    prompt: `${STYLE}\nAn abstract data-visualisation illustration: a clean upward bar chart or line
graph combined with a small map-pin icon and a star icon, conveying measurable business growth
from local search. Square 1:1 composition.`,
  },
  {
    slug: 'case-study-local-rankings',
    model: 'gemini-2.5-flash-image',
    prompt: `${STYLE}\nAn abstract illustration of a search results list represented as simple
stacked rounded rectangle bars, with the top bar highlighted in teal and a small trophy or number-1
badge icon beside it, conveying reaching the top of local search rankings. Square 1:1 composition.`,
  },
  {
    slug: 'blog-local-seo-guide-hero',
    model: 'gemini-2.5-flash-image',
    prompt: `${STYLE}\nAn illustration for an educational article about local SEO: a stylised
magnifying glass hovering over a simplified map with a highlighted pin, small checklist icon
beside it. Wide 16:9 composition with negative space for text overlay.`,
  },
  {
    slug: 'blog-ai-search-guide-hero',
    model: 'gemini-2.5-flash-image',
    prompt: `${STYLE}\nAn illustration for an educational article about AI search visibility: a
stylised chat bubble with a small spark icon inside, connected to three small generic app/assistant
icons, conveying multiple AI assistants referencing a business. Wide 16:9 composition with
negative space for text overlay.`,
  },
  {
    slug: 'about-team-illustration',
    model: 'gemini-3-pro-image-preview',
    prompt: `${STYLE}\nAn abstract illustration representing a small, hands-on digital agency team:
simplified geometric figures (no facial features, no realistic human depiction) collaborating
around a shared table with a laptop, a map pin icon, and a chart icon on the table, conveying a
close-knit, dedicated local team. Wide 16:9 composition.`,
  },
];

async function generateOne({ slug, model, prompt }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
  const body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`[${slug}] HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part) {
    throw new Error(`[${slug}] No image returned. Response: ${JSON.stringify(data).slice(0, 500)}`);
  }

  const bytes = Buffer.from(part.inlineData.data, 'base64');
  const outPath = path.join(OUT_DIR, `${slug}.png`);
  await writeFile(outPath, bytes);
  console.log(`✓ ${slug} (${model}) -> ${outPath} (${bytes.length} bytes)`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  const only = onlyArg ? new Set(onlyArg.replace('--only=', '').split(',')) : null;
  const targets = only ? IMAGES.filter((i) => only.has(i.slug)) : IMAGES;

  console.log(`Generating ${targets.length} image(s)...`);

  for (const img of targets) {
    try {
      await generateOne(img);
    } catch (err) {
      console.error(err.message);
    }
    // Small delay to be gentle on rate limits.
    await new Promise((r) => setTimeout(r, 1500));
  }
}

main();
