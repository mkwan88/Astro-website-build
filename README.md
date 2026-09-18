# Kwantum Website

Astro site for Kwantum — a Melbourne-based, Australia-wide local SEO, website design, and AI
search visibility agency.

See [Kwantum Brand Guidelines.md](Kwantum%20Brand%20Guidelines.md) for the brand system and
[SEO-NOTES.md](SEO-NOTES.md) for the SEO architecture, schema reference, and pre-launch checklist.

## Project Structure

```text
/
├── public/                  Static files (favicon, robots.txt, og-default.png)
├── scripts/
│   └── generate-images.mjs  Generates on-brand imagery via the Gemini API ("Nano Banana")
├── src/
│   ├── assets/generated/    AI-generated source images (converted to WebP at build time)
│   ├── components/          Reusable Astro components
│   ├── content/             Content collections (services, areas, location-services,
│   │                        case-studies, blog, testimonials)
│   ├── content.config.ts    Content collection schemas (Zod)
│   ├── lib/                 Site constants (site.ts) and JSON-LD schema builders (schema.ts)
│   ├── layouts/              BaseLayout.astro
│   ├── pages/                Routes, including dynamic area/service pages
│   └── styles/global.css    Tailwind + design tokens (brand/accent colors, fonts)
└── package.json
```

## Commands

| Command | Action |
| :--- | :--- |
| `npm install` | Install dependencies |
| `npm run dev` | Start local dev server at `localhost:4321` |
| `npm run build` | Build the production site to `./dist/` |
| `npm run preview` | Preview the production build locally |
| `node scripts/generate-images.mjs` | Regenerate all AI imagery (requires `GEMINI_API_KEY`) |

## Adding a New City

1. Copy `src/content/areas/example-area.md`, rename it to the new city's slug, and replace every
   bracketed placeholder with genuine, specific local knowledge.
2. Copy the three `example-area-*.md` files in `src/content/location-services/`, renamed to
   `{new-city}-{service}.md`, again replacing every placeholder with real local detail.
3. Set `isPlaceholder: false` on the new area entry.
4. Optionally generate a hero image for the new city by adding an entry to
   `scripts/generate-images.mjs` and running it with `--only=your-new-slug`.

No page templates need to change — `getStaticPaths` in `src/pages/areas/[area]/index.astro` and
`src/pages/areas/[area]/[service].astro` picks up new content collection entries automatically.
