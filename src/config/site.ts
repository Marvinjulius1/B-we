/**
 * Zentrale Firmen- und Seitendaten. Quelle: docs/boewe-briefing.md.
 * Öffnungszeiten, Kontakt und Navigation werden NUR hier gepflegt.
 *
 * ⚠ Öffnungszeiten: Die bisherige Seite nennt widersprüchliche Zeiten (Mo–Do 8–17 + Fr 8–13 vs. Mo–Fr 8–17).
 *   Standard laut Projektvorgabe: Mo–Do 8–17 Uhr, Fr 8–13 Uhr. Bitte vom Kunden bestätigen lassen.
 */

export const site = {
  name: "Böwe",
  legalName: "Böwe GmbH",
  claim: "Seit 1924 – Fach- und Großhandel für Handwerk, Industrie und Haus & Garten",
  shortClaim: "Seit 1924 in Aurich",
  foundingYear: 1924,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "de_DE",

  address: {
    street: "Breiter Weg 60",
    postalCode: "26603",
    city: "Aurich",
    region: "Ostfriesland",
    country: "DE",
  },
  /** Statischer Kartenlink (keine Einbettung ohne Einwilligung) */
  mapsUrl: "https://www.openstreetmap.org/search?query=Breiter%20Weg%2060%2C%2026603%20Aurich",

  contact: {
    phoneDisplay: "04941 954233",
    phoneHref: "tel:+494941954233",
    whatsappDisplay: "0170 3030221",
    whatsappHref: "https://wa.me/491703030221",
    email: "shop@boewe24.de",
  },

  management: ["Uta Böwe-Wölfle", "Maik Wölfle"],

  facts: {
    employees: "ca. 60",
    salesArea: "1.200 m²",
    warehouse: "5.000 m²",
    plot: "ca. 3,2 ha",
    generation: "3. Generation",
  },

  /** Öffnungszeiten Ladengeschäft & Telefon (ISO-Wochentage 1 = Montag) */
  openingHours: [
    { days: [1, 2, 3, 4], label: "Mo – Do", opens: "08:00", closes: "17:00" },
    { days: [5], label: "Fr", opens: "08:00", closes: "13:00" },
  ],
  openingHoursNote: "Sa, So und an Feiertagen geschlossen",

  social: [
    { label: "Facebook", href: "https://www.facebook.com/boeweaurich" },
    // Instagram/YouTube: auf der alten Seite nur generisch verlinkt – Profil-URLs beim Kunden erfragen
  ],

  /** B2B-Shop mit Geschäftskundenkonditionen (separates System, siehe Briefing) */
  b2bShopUrl: "https://www.b2boewe.de",
} as const;

export type OpeningHours = (typeof site.openingHours)[number];

const DAY_NAMES = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"] as const;
const SCHEMA_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export function openingHoursText(): string {
  return site.openingHours.map((h) => `${h.label} ${h.opens.replace(":00", "")}–${h.closes.replace(":00", "")} Uhr`).join(", ");
}

/** Für JSON-LD (schema.org/OpeningHoursSpecification) */
export function openingHoursSchema() {
  return site.openingHours.map((h) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: h.days.map((d) => SCHEMA_DAYS[d - 1]),
    opens: h.opens,
    closes: h.closes,
  }));
}

export { DAY_NAMES };

export const mainNav = [
  { label: "Shop", href: "/shop" },
  { label: "Gitterroste nach Maß", href: "/gitterroste-nach-mass" },
  { label: "Marken", href: "/marken" },
  { label: "Fundgrube", href: "/shop/fundgrube" },
  { label: "Ladengeschäft", href: "/ladengeschaeft" },
] as const;

export const footerNav = {
  shop: [
    { label: "Alle Kategorien", href: "/shop" },
    { label: "Neu im Sortiment", href: "/neu-im-sortiment" },
    { label: "Bestseller", href: "/bestseller" },
    { label: "Marken", href: "/marken" },
    { label: "Fundgrube", href: "/shop/fundgrube" },
    { label: "Anhängerzubehör", href: "/shop/anhaengerzubehoer" },
    { label: "Gitterroste nach Maß", href: "/gitterroste-nach-mass" },
  ],
  service: [
    { label: "Kontakt", href: "/kontakt" },
    { label: "Rückruf-Service", href: "/kontakt#rueckruf" },
    { label: "Versand", href: "/service/versand" },
    { label: "Zahlungsmöglichkeiten", href: "/service/zahlung" },
    { label: "Rückgabe & Widerruf", href: "/service/rueckgabe" },
    { label: "Geschäftskunden", href: "/geschaeftskunden" },
    { label: "Newsletter", href: "/newsletter" },
  ],
  company: [
    { label: "Wir über uns", href: "/ueber-uns" },
    { label: "Ladengeschäft Aurich", href: "/ladengeschaeft" },
    { label: "Nachhaltigkeit", href: "/nachhaltigkeit" },
    { label: "Handwerkstadt", href: "/handwerkstadt" },
    { label: "Forum", href: "/forum" },
  ],
  legal: [
    { label: "Impressum", href: "/impressum" },
    { label: "Datenschutz", href: "/datenschutz" },
    { label: "AGB", href: "/agb" },
    { label: "Widerrufsbelehrung", href: "/widerruf" },
    { label: "Gewährleistung", href: "/gewaehrleistung" },
    { label: "Batteriegesetz", href: "/batteriegesetz" },
    { label: "Barrierefreiheit", href: "/barrierefreiheit" },
    { label: "Sitemap", href: "/sitemap" },
  ],
} as const;

export const trustPoints = [
  { title: "Hervorragender Service", text: "Persönliche Beratung am Telefon, per WhatsApp oder im Laden." },
  { title: "Schnelle Lieferung", text: "In der Regel 2–3 Werktage, große Mengen per Spedition." },
  { title: "Große Auswahl", text: "Von der Schraube bis zum Rollgerüst – für Profis und Privat." },
  { title: "Eigenes Ladengeschäft", text: "1.200 m² Verkaufsfläche am Breiter Weg in Aurich." },
] as const;
