# Kwantum — SEO & Technical Notes

Reference doc for the site's SEO architecture, schema, and a pre-launch checklist. Pairs with
[Kwantum Brand Guidelines.md](Kwantum%20Brand%20Guidelines.md).

## 1. Sitemap Structure

```
/                                        Home
/about/                                  About
/pricing/                                Pricing
/contact/                                Contact
/services/                               Services index
/services/local-seo/                     Core service
/services/website-design/                Core service
/services/ai-search-visibility/          Core service
/areas/                                  Areas index
/areas/melbourne/                        Real area hub (home base)
/areas/melbourne/local-seo/              Location-service page
/areas/melbourne/website-design/         Location-service page
/areas/melbourne/ai-search-visibility/   Location-service page
/areas/example-area/                     TEMPLATE area hub
/areas/example-area/local-seo/           TEMPLATE location-service page
/areas/example-area/website-design/      TEMPLATE location-service page
/areas/example-area/ai-search-visibility/ TEMPLATE location-service page
/case-studies/                           Index
/case-studies/[slug]/                    2 placeholder case studies
/blog/                                   Index (+ /rss.xml)
/blog/[slug]/                            2 sample posts
/privacy-policy/  /terms/                Boilerplate (noindex until reviewed)
/404
```

Auto-generated: `sitemap-index.xml` (via `@astrojs/sitemap`), `robots.txt` (static, in `public/`).

**Adding a new city:** add one file to `src/content/areas/`, plus one file per service to
`src/content/location-services/` (`{area}-{service}.md`) with a genuinely unique local angle. No
template/page code changes needed — `getStaticPaths` cross-joins automatically.

## 2. Page-by-Page SEO Templates

| Page type | Title template | Notes |
|---|---|---|
| Home | `Kwantum — Local SEO & Websites That Get You Found` | Custom, brand + core value prop |
| Core service | `{Service} \| Kwantum` | From `metaTitle` field |
| Area hub | `{Service Category} in {City} \| Kwantum` | From `metaTitle` field |
| Location-service | `{Service} in {City} \| Kwantum` | From `metaTitle` field |
| Case study | `Case Study: {Angle} \| Kwantum` | From `metaTitle` field |
| Blog post | `{Title} \| Kwantum Blog` | From `metaTitle` field |

All meta descriptions are authored per-entry in frontmatter (`metaDescription`) — never
auto-truncated from body copy, so every one is deliberately written for CTR.

- One `<h1>` per page, always the primary keyword for that page.
- Canonical URL emitted on every page via [SeoHead.astro](src/components/SeoHead.astro).
- OpenGraph + Twitter card meta on every page, using each entry's hero image where available,
  falling back to `/og-default.png`.

## 3. Schema (JSON-LD) — Reference

Builders live in [src/lib/schema.ts](src/lib/schema.ts). Applied per page type:

- **Home / About:** `organizationSchema()` — `ProfessionalService`, includes Melbourne address
  (placeholder — see checklist) and `areaServed: Australia`.
- **Core service pages:** `serviceSchema()` — `Service`, national `areaServed`.
- **Area hubs & location-service pages:** `localBusinessSchema()` — `ProfessionalService` with
  `areaServed` set to that area's suburb list. Only the home-base area (Melbourne) includes a full
  postal address + geo coordinates; the placeholder template area intentionally omits them, since
  it has no real physical presence.
- **Every page:** `breadcrumbSchema()` — `BreadcrumbList` matching the visible breadcrumb trail.
- **Anywhere an FAQ accordion renders:** `faqSchema()` — `FAQPage`.
- **Blog posts:** `articleSchema()` — `Article`.

**Deliberately not implemented:** `Review` / `AggregateRating` schema on testimonials. All current
testimonials are placeholder/illustrative (flagged `isPlaceholder: true`), and marking fabricated
quotes up as schema-validated reviews would violate Google's structured data guidelines on
fabricated reviews. Add review schema only once real, attributable reviews exist.

Example (Service schema, simplified):
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Local SEO & Google Business Profile",
  "name": "Local SEO & Google Business Profile",
  "provider": { "@id": "https://www.kwantum.com.au/#organization" },
  "areaServed": { "@type": "Country", "name": "Australia" }
}
```

## 4. Internal Linking Plan

- **Breadcrumbs** on every non-home page, top of page, matching `BreadcrumbList` schema exactly.
- **Core service pages** list "Available in: {area}" links to every area's location-service page.
- **Area hubs** link to their 3 location-service pages, and each location-service page links back
  to both its area hub and its core service page (bidirectional, contextual anchor text).
- **Footer** carries a full site map: all services, all areas, company pages, legal.
- **Blog posts** cross-link to the one most relevant service and/or area page via `relatedService`
  / `relatedArea` frontmatter — anchor text is specific ("Explore Local SEO"), never "click here."
- **Case studies** link to the service and area involved in that engagement.

## 5. Image Naming & Generation

All imagery generated via [scripts/generate-images.mjs](scripts/generate-images.mjs) using the
Gemini API ("Nano Banana" `gemini-2.5-flash-image` for simpler icons/illustrations, "Nano Banana
Pro" `gemini-3-pro-image-preview` for hero-quality images), saved as PNG into
`src/assets/generated/`, then automatically converted to WebP by Astro's `<Image>` component at
build time — no manual conversion step.

**Naming convention:** descriptive, keyword-relevant, kebab-case, e.g.:
- `service-local-seo-hero.png` → served as `.../service-local-seo-hero.[hash].webp`
- `area-melbourne-hero.png`
- `case-study-growth-chart.png`

**Alt text:** authored per-image in collection frontmatter (`heroImageAlt` etc.), written to
describe the image *and* reinforce page intent — not keyword-stuffed.

**To add more images later:** add an entry to the `IMAGES` array in `generate-images.mjs` and run
`node scripts/generate-images.mjs --only=your-new-slug`.

## 6. Pre-Launch Checklist

Everything below is a placeholder that must be replaced with real information before this site
goes live:

- [ ] **Domain:** confirm/register `kwantum.com.au` (or chosen domain) and update `site` in
      [astro.config.mjs](astro.config.mjs) and `SITE.url` in [src/lib/site.ts](src/lib/site.ts).
- [ ] **Legal entity name:** confirm `SITE.legalName` in `src/lib/site.ts`.
- [ ] **Address:** replace the placeholder street address / postcode in `src/lib/site.ts` and
      `src/content/areas/melbourne.md` with Kwantum's real registered address.
- [ ] **Phone & email:** replace placeholders in `src/lib/site.ts`.
- [ ] **Social links:** replace placeholder LinkedIn/Instagram URLs in `src/lib/site.ts`, or remove
      if not applicable.
- [ ] **Contact form backend:** the form on `/contact/` is static HTML with no submission handler
      wired up. Connect it to Netlify Forms (if hosting on Netlify), Formspree, or a serverless
      function before launch — see the comment in `src/pages/contact.astro`.
- [ ] **Legal pages:** `/privacy-policy/` and `/terms/` are boilerplate structure only (currently
      `noindex`) — have them reviewed/drafted properly for the Privacy Act 1988 (APPs) and
      Australian Consumer Law, then remove the `noindex` flag.
- [ ] **Testimonials, case studies, pricing:** all currently placeholder/illustrative (flagged in
      UI with visible badges). Replace with real client content as it becomes available, and only
      add `Review`/`AggregateRating` schema once testimonials are genuine and attributable.
- [ ] **New area pages:** duplicate `src/content/areas/example-area.md` and its three
      `location-services` entries per new city, replacing every bracketed placeholder with real,
      specific local knowledge (see the template file's own instructions).
- [ ] **Google Business Profile / Maps embed:** the Melbourne area page embeds a basic Maps iframe
      keyed to the city name; once a real GBP listing exists, consider swapping to a
      place-ID‑based embed for precision.
- [ ] **Analytics:** no analytics package is installed yet — add one (e.g. Plausible, Fathom, or
      GA4) before launch.
- [ ] **Favicon variants:** currently a single SVG favicon (`public/favicon.svg`); add PNG
      fallbacks / apple-touch-icon if broader device support is needed.

## 7. Final Implementation Notes

- Astro static output — deployable to any static host (Netlify, Vercel, Cloudflare Pages, etc.)
  with zero server requirements.
- Run `npm run build` to verify before every deploy; `npm run preview` serves the built output
  locally.
- Content lives entirely in `src/content/*` as Markdown — no CMS dependency, easy to hand off.
