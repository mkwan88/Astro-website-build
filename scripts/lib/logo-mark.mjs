/**
 * The Kwantum mark ("signal sticker"): the K on a yellow sticker tile with a hard ink shadow,
 * plus a coral dot with a signal ring in the top-right corner. Shared by generate-logo.mjs and
 * generate-covers.mjs so every file uses exactly the same shape. Mirrors src/components/Logo.astro.
 */
export const COLORS = {
  ink: '#1E1B4B',
  cream: '#FBF6EC',
  yellow: '#FFCB47',
  coral: '#FF8A65',
  white: '#FFFFFF',
};

/** Inner SVG markup of the mark in a 0..40 tile space. Use ring = cream on dark backgrounds. */
export function markBody({ tilt = -7, ring = COLORS.ink } = {}) {
  const C = COLORS;
  return `<g transform="rotate(${tilt} 20 20)">
    <rect y="3" width="40" height="40" rx="11" fill="${C.ink}"/>
    <rect width="40" height="40" rx="11" fill="${C.yellow}"/>
    <rect x="10" y="8" width="5" height="24" rx="1.5" fill="${C.ink}"/>
    <path d="M17 20 L25.3 12.6" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
    <path d="M17 20 L30 32" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="36" cy="4" r="8" fill="none" stroke="${ring}" stroke-width="2.4"/>
    <circle cx="36" cy="4" r="4.6" fill="${C.coral}"/>
  </g>`;
}
