# Kwantum Brand Guidelines

A working brand system for Kwantum's website and future marketing materials. This is a fresh
identity proposed as part of the initial site build — treat it as a strong starting point, not a
locked-in final brand.

## Positioning & Tone of Voice

**Positioning:** Kwantum is the antidote to two bad experiences small businesses know well: the
website agency that disappears after launch, and the SEO agency that hides behind jargon and
vanity metrics. Kwantum builds fast, modern websites and drives real local + AI search visibility,
then sticks around.

**Tone:** Confident, plain-English, straight-talking. Never condescending, never jargon-heavy.
Think "a switched-on friend who happens to know SEO," not "corporate agency deck."

- Say "we build it properly" instead of "leveraging best-in-class methodologies."
- Say "no ticket queue" instead of "dedicated customer success framework."
- Short sentences. Concrete claims. No filler adjectives ("amazing," "cutting-edge," "world-class").

This is deliberately distinct from wp-ok.de's warm, folksy German-market tone — Kwantum's voice is
a little more direct and Australian, less anecdotal, still human and jargon-free.

## Color Palette

Primary: **Indigo** (trust, technology, depth). Accent: **Teal** (clarity, growth, freshness).
Distinct from wp-ok.de's blue/orange system.

| Token | Hex | Use |
|---|---|---|
| `brand-950` | `#1E1B4B` | Rarely used, deepest backgrounds |
| `brand-900` | `#312E81` | Dark section backgrounds (CTA bands), dark headings |
| `brand-700` | `#4338CA` | Hover state for primary buttons/links |
| `brand-600` | `#4F46E5` | **Primary** — buttons, links, icon accents |
| `brand-100` | `#E0E7FF` | Light tints, icon backgrounds |
| `brand-50` | `#EEF2FF` | Section background washes |
| `accent-600` | `#0D9488` | Accent hover state |
| `accent-500` | `#14B8A6` | Accent highlights, badges |
| `accent-400` | `#2DD4BF` | CTA buttons on dark backgrounds, logo dot |
| Slate 50–900 | — | All neutral text/backgrounds (Tailwind's default slate scale) |

**Usage rules:**
- Primary indigo carries all core interactive elements (buttons, links, active nav states).
- Teal/accent is reserved for CTAs on dark backgrounds and small highlight moments — don't let
  it dominate a page, it loses impact if overused.
- Never place indigo text on a brand-900 background (contrast fails) — use white or brand-50.

## Typography

- **Headings:** Manrope Variable (geometric, confident, slightly distinctive) — self-hosted via
  Fontsource for performance (no external font request).
- **Body:** Inter Variable (highly legible workhorse) — also self-hosted via Fontsource.
- Both are variable fonts, loaded once, with `font-display: swap` behaviour handled by Fontsource's
  default CSS.

## Logo & Icon Mark

The Kwantum mark is a hand-built SVG, not AI-generated (AI image models render logos/text poorly
and inconsistently across regenerations — a logo needs to be pixel-stable).

- **Icon mark:** a rounded square (indigo-600) containing a geometric white "K" built from one
  vertical bar and two diagonal strokes, with a small teal accent circle at the top-right corner
  (evoking an orbiting "quantum" node, and echoing the map-pin/visibility theme used throughout the
  site's imagery).
- **Wordmark:** "Kwantum" set in Manrope Extrabold, in `brand-900`.
- Source: [Logo.astro](src/components/Logo.astro) (also used standalone as `public/favicon.svg`).
- **Clear space:** keep at least the height of the icon mark as empty space around the full logo.
- **Don't:** stretch the mark, recolor it outside the palette above, or place it on a background
  that fails contrast (avoid mid-tone teal or brand-500 backgrounds behind the white "K").

## Imagery Style

All generated imagery (via Gemini / "Nano Banana" and "Nano Banana Pro") follows one shared style
prompt, defined once in [scripts/generate-images.mjs](scripts/generate-images.mjs), so new images
stay consistent as the site grows:

> Modern flat-vector illustration, minimalist geometric shapes, soft subtle gradients, brand color
> palette of deep indigo and teal, on a clean white/light background. Confident, tech-forward,
> professional SaaS/agency aesthetic. No text, no logos, no watermarks, abstract/stylised only
> (never a fabricated "real photo" of a person or a specific real business).

**Rules for future images:**
- Never generate a photorealistic image implying it's a real client, employee, or testimonial-giver
  — use abstract/geometric illustration instead (see the ethical note in SEO-NOTES.md).
- Keep the indigo/teal palette; don't introduce new hues without updating this document.
- Prefer 16:9 for hero images (wide sections) and 1:1 for card-style images (case studies).
- Always run new prompts through the shared `STYLE` constant in `generate-images.mjs` rather than
  writing one-off styling per image.

## Applying This System Elsewhere

If Kwantum produces slide decks, social graphics, or printed materials later, reuse:
- The exact hex values above (don't eyeball colors from screenshots).
- Manrope for headings / Inter for body wherever possible.
- The icon mark at a minimum size where the "K" strokes remain legible (roughly 24px and up).
