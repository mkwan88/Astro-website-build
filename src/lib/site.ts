// Central place for site-wide constants used across SEO, schema, and layout.

export const SITE = {
  name: 'Kwantum',
  legalName: 'Kwantum Digital Pty Ltd',
  url: 'https://kwantum.net',
  tagline: 'Local SEO and websites that get your business found',
  description:
    'Kwantum builds fast, modern websites and drives local SEO and AI-search visibility for businesses across Australia — based in Melbourne, working nationally.',
  email: 'mark@kwantum.net',
  phone: '+61 423 952 441',
  phoneDisplay: '0423 952 441',
  // Service-area business: the street address is deliberately not published (matches the
  // Google Business Profile, which hides it). Keep these fields identical to the GBP.
  address: {
    addressLocality: 'Ascot Vale',
    addressRegion: 'VIC',
    postalCode: '3032',
    addressCountry: 'AU',
  },
  // Real, live profile URLs only (LinkedIn, Instagram, GBP share link…). Used for schema `sameAs`.
  sameAs: [] as string[],
  ogImage: '/og-default.png',
} as const;

export const NAV_LINKS = [
  { label: 'Services', href: '/services/' },
  { label: 'Areas We Serve', href: '/areas/' },
  { label: 'Pricing', href: '/pricing/' },
  { label: 'Blog', href: '/blog/' },
  { label: 'About', href: '/about/' },
] as const;
