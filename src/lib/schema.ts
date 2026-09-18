import { SITE } from './site';

type BreadcrumbItem = { name: string; url: string };
type FaqItem = { question: string; answer: string };

/** Organization / ProfessionalService schema — used on the homepage and About page. */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${SITE.url}/#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    description: SITE.description,
    email: SITE.email,
    telephone: SITE.phone,
    image: `${SITE.url}${SITE.ogImage}`,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.address.streetAddress,
      addressLocality: SITE.address.addressLocality,
      addressRegion: SITE.address.addressRegion,
      postalCode: SITE.address.postalCode,
      addressCountry: SITE.address.addressCountry,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE.geo.latitude,
      longitude: SITE.geo.longitude,
    },
    areaServed: {
      '@type': 'Country',
      name: 'Australia',
    },
    sameAs: [SITE.social.linkedin, SITE.social.instagram],
  };
}

/**
 * LocalBusiness + Service schema for an area hub or location-service page.
 * `isHomeBase` includes the full address/geo; other (placeholder/template) areas
 * only get areaServed, since they don't represent a real physical presence.
 */
export function localBusinessSchema({
  areaName,
  suburbs,
  url,
  isHomeBase,
}: {
  areaName: string;
  suburbs: string[];
  url: string;
  isHomeBase: boolean;
}) {
  const base: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: `${SITE.name} — ${areaName}`,
    url,
    parentOrganization: { '@id': `${SITE.url}/#organization` },
    areaServed: suburbs.map((s) => ({ '@type': 'Place', name: s })),
  };

  if (isHomeBase) {
    base.address = {
      '@type': 'PostalAddress',
      streetAddress: SITE.address.streetAddress,
      addressLocality: SITE.address.addressLocality,
      addressRegion: SITE.address.addressRegion,
      postalCode: SITE.address.postalCode,
      addressCountry: SITE.address.addressCountry,
    };
    base.geo = {
      '@type': 'GeoCoordinates',
      latitude: SITE.geo.latitude,
      longitude: SITE.geo.longitude,
    };
  }

  return base;
}

/** Service schema for a core service page. */
export function serviceSchema({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: name,
    name,
    description,
    url,
    provider: { '@id': `${SITE.url}/#organization` },
    areaServed: {
      '@type': 'Country',
      name: 'Australia',
    },
  };
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqSchema(items: FaqItem[]) {
  if (!items.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function articleSchema({
  title,
  description,
  url,
  image,
  publishDate,
  author,
}: {
  title: string;
  description: string;
  url: string;
  image: string;
  publishDate: Date;
  author: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    image,
    datePublished: publishDate.toISOString(),
    author: {
      '@type': 'Organization',
      name: author,
    },
    publisher: { '@id': `${SITE.url}/#organization` },
  };
}
