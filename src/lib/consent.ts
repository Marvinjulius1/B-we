/**
 * Einwilligungs-Modell (TTDSG § 25 / DSGVO Art. 6 Abs. 1 lit. a).
 * Ohne Einwilligung werden KEINE Drittanbieter geladen. Standard ist "abgelehnt".
 */
export const CONSENT_COOKIE = "boewe_consent";
/** Bei Änderung der Kategorien/Dienste erhöhen → Banner erscheint erneut */
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_DAYS = 180;

export type ConsentCategory = "statistics" | "marketing" | "external";

export interface ConsentState {
  v: number;
  /** ISO-Zeitstempel der Entscheidung (Nachweis) */
  at: string;
  granted: Record<ConsentCategory, boolean>;
}

export const CONSENT_CATEGORIES: {
  id: ConsentCategory | "necessary";
  label: string;
  description: string;
  services: string[];
  required?: boolean;
}[] = [
  {
    id: "necessary",
    label: "Notwendig",
    description:
      "Für den Betrieb des Shops erforderlich: Warenkorb, Merkzettel, Anmeldung, Farbschema und das Speichern Ihrer Auswahl hier. Keine Weitergabe an Dritte.",
    services: ["Warenkorb & Merkzettel (lokal)", "Sitzung/Anmeldung", "Einwilligungsstatus"],
    required: true,
  },
  {
    id: "statistics",
    label: "Statistik",
    description: "Hilft uns zu verstehen, wie die Seite genutzt wird, damit wir sie verbessern können.",
    services: ["Reichweitenmessung (Anbieter wird vor Aktivierung hier benannt)"],
  },
  {
    id: "marketing",
    label: "Marketing",
    description: "Misst den Erfolg von Anzeigen, z. B. für Aktionen wie die Stihl-Herbstaktion.",
    services: ["Werbe-Conversion (Anbieter wird vor Aktivierung hier benannt)"],
  },
  {
    id: "external",
    label: "Externe Medien",
    description:
      "Inhalte von Drittanbietern wie Videos, interaktive Karten oder Spamschutz-Dienste. Dabei werden Daten (u. a. Ihre IP-Adresse) an den Anbieter übertragen.",
    services: ["YouTube-Videos", "Interaktive Karte", "Spamschutz-Dienst (Captcha)"],
  },
];

export const DENY_ALL: Record<ConsentCategory, boolean> = { statistics: false, marketing: false, external: false };
export const GRANT_ALL: Record<ConsentCategory, boolean> = { statistics: true, marketing: true, external: true };

export function parseConsent(raw: string | undefined | null): ConsentState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as ConsentState;
    if (parsed.v !== CONSENT_VERSION || !parsed.granted) return null;
    return { v: parsed.v, at: parsed.at, granted: { ...DENY_ALL, ...parsed.granted } };
  } catch {
    return null;
  }
}
