const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

/** Formatiert einen Cent-Betrag als Euro-Preis, z. B. 3250 → "32,50 €". */
export function formatPrice(cents: number): string {
  return eur.format(cents / 100);
}

/** Netto aus Brutto (für B2B-Hinweise), kaufmännisch gerundet. */
export function netFromGross(grossCents: number, taxRatePercent: number): number {
  return Math.round(grossCents / (1 + taxRatePercent / 100));
}

/**
 * Parst Preisangaben aus Warenwirtschafts-Exporten robust:
 * "32,50" · "1.299,00" · "32.50" · "1,299.00" · "32,50 €" · 32.5  → Euro als Zahl.
 * Gibt null zurück, wenn kein eindeutiger Wert erkennbar ist.
 */
export function parseDecimal(input: unknown): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (typeof input !== "string") return null;
  let s = input.replace(/[€\s]|EUR/gi, "").trim();
  if (!s) return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    // Das zuletzt stehende Trennzeichen ist das Dezimaltrennzeichen
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma > -1) {
    s = s.replace(",", ".");
  } else if (lastDot > -1 && /^\d{1,3}(\.\d{3})+$/.test(s)) {
    // "1.299" ohne Nachkommastellen = Tausenderpunkt
    s = s.replace(/\./g, "");
  }
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

export function toCents(euro: number): number {
  return Math.round(euro * 100);
}
