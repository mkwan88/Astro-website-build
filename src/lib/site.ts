// Central place for site-wide constants used across SEO, schema, and layout.
// PLACEHOLDER VALUES are marked below — replace before launch. See SEO-NOTES.md.

export const SITE = {
  name: 'Kwantum',
  legalName: 'Kwantum Digital Pty Ltd', // PLACEHOLDER — confirm registered entity name
  url: 'https://kwantum.net',
  tagline: 'Local SEO and websites that get your business found',
  description:
    'Kwantum builds fast, modern websites and drives local SEO and AI-search visibility for businesses across Australia — based in Melbourne, working nationally.',
  email: 'mark@kwantum.net',
  phone: '+61 423 952 441',
  phoneDisplay: '0423 952 441',
  address: {
    streetAddress: 'Level 2, 123 Example Street', // PLACEHOLDER
    addressLocality: 'Melbourne',
    addressRegion: 'VIC',
    postalCode: '3000', // PLACEHOLDER
    addressCountry: 'AU',
  },
  geo: {
    latitude: -37.8136,
    longitude: 144.9631,
  },
  social: {
    linkedin: 'https://www.linkedin.com/company/kwantum', // PLACEHOLDER
    instagram: 'https://www.instagram.com/kwantum.digital', // PLACEHOLDER
  },
  ogImage: '/og-default.png',
} as const;

export const NAV_LINKS = [
  { label: 'Services', href: '/services/' },
  { label: 'Areas We Serve', href: '/areas/' },
  { label: 'Case Studies', href: '/case-studies/' },
  { label: 'Pricing', href: '/pricing/' },
  { label: 'Blog', href: '/blog/' },
  { label: 'About', href: '/about/' },
] as const;
