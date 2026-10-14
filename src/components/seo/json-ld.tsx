import { openingHoursSchema, site } from "@/config/site";

/** Rendert strukturierte Daten. "<" wird escaped, damit kein Script-Breakout möglich ist. */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
  );
}

export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}

export function organizationSchema() {
  const address = {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    postalCode: site.address.postalCode,
    addressLocality: site.address.city,
    addressRegion: "Niedersachsen",
    addressCountry: site.address.country,
  };
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": absoluteUrl("/#organization"),
      name: site.legalName,
      url: site.url,
      logo: absoluteUrl("/brand/boewe-logo.png"),
      foundingDate: String(site.foundingYear),
      email: site.contact.email,
      telephone: "+49 4941 954233",
      address,
      sameAs: site.social.map((s) => s.href),
    },
    {
      "@context": "https://schema.org",
      "@type": ["HardwareStore", "LocalBusiness"],
      "@id": absoluteUrl("/#store"),
      name: `${site.legalName} – Ladengeschäft Aurich`,
      parentOrganization: { "@id": absoluteUrl("/#organization") },
      url: absoluteUrl("/ladengeschaeft"),
      image: absoluteUrl("/brand/og-default.png"),
      telephone: "+49 4941 954233",
      email: site.contact.email,
      address,
      areaServed: ["Aurich", "Ostfriesland"],
      openingHoursSpecification: openingHoursSchema(),
      priceRange: "€€",
    },
  ];
}

export function breadcrumbSchema(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.href),
    })),
  };
}
