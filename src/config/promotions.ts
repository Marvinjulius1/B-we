/**
 * Aktionen für die Startseite. Inhalte bitte nur mit freigegebenen Konditionen befüllen
 * (keine Rabattversprechen ohne Bestätigung durch Böwe).
 */
export interface Promotion {
  id: string;
  active: boolean;
  eyebrow: string;
  title: string;
  text: string;
  cta: { label: string; href: string };
  motif: string;
}

export const promotions: Promotion[] = [
  {
    id: "stihl-herbst",
    active: true,
    eyebrow: "Herbst bei Böwe",
    title: "Laubzeit ist Akkuzeit.",
    text: "Stihl Akku-Blasgeräte, Motorsensen und Motorsägen ab Lager Aurich – mit persönlicher Einweisung im Laden.",
    cta: { label: "Stihl entdecken", href: "/shop/garten-und-forst/stihl" },
    motif: "garden",
  },
];
