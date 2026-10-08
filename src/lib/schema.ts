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
      addressLocality: SITE.address.addressLocality,
      addressRegion: SITE.address.addressRegion,
      postalCode: SITE.address.postalCode,
      addressCountry: SITE.address.addressCountry,
    },
    areaServed: {
      '@type': 'Country',
      name: 'Australia',
    },
    ...(SITE.sameAs.length ? { sameAs: SITE.sameAs } : {}),
  };
}

/**
 * LocalBusiness + Service schema for an area hub or location-service page.
 * `isHomeBase` includes the (street-less, service-area) postal address; other (placeholder/template) areas
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
      addressLocality: SITE.address.addressLocality,
      addressRegion: SITE.address.addressRegion,
      postalCode: SITE.address.postalCode,
      addressCountry: SITE.address.addressCountry,
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
  updatedDate,
  author,
}: {
  title: string;
  description: string;
  url: string;
  image: string;
  publishDate: Date;
  updatedDate?: Date;
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
    dateModified: (updatedDate ?? publishDate).toISOString(),
    author: {
      '@type': 'Person',
      name: author,
      url: `${SITE.url}/about/`,
      worksFor: { '@id': `${SITE.url}/#organization` },
    },
    publisher: { '@id': `${SITE.url}/#organization` },
  };
}
