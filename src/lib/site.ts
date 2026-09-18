// Central place for site-wide constants used across SEO, schema, and layout.
// PLACEHOLDER VALUES are marked below — replace before launch. See SEO-NOTES.md.

export const SITE = {
  name: 'Kwantum',
  legalName: 'Kwantum Digital Pty Ltd', // PLACEHOLDER — confirm registered entity name
  url: 'https://www.kwantum.com.au', // PLACEHOLDER domain — confirm/register before launch
  tagline: 'Local SEO and websites that get your business found',
  description:
    'Kwantum builds fast, modern websites and drives local SEO and AI-search visibility for businesses across Australia — based in Melbourne, working nationally.',
  email: 'hello@kwantum.com.au', // PLACEHOLDER
  phone: '+61 3 0000 0000', // PLACEHOLDER
  phoneDisplay: '(03) 0000 0000', // PLACEHOLDER
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
