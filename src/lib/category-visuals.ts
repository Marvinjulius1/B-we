/** Zuordnung Kategorie-Icon → selbst erzeugtes Platzhalter-Motiv (bis echte Fotos vorliegen). */
const MOTIF: Record<string, string> = {
  grating: "grating",
  hardware: "chain",
  garden: "garden",
  electric: "light",
  safety: "workwear",
  security: "lock",
  door: "door",
  fence: "fence",
  construction: "scaffold",
  trailer: "trailer",
  deal: "construction",
};

export function categoryImage(icon: string | null | undefined, variant: 1 | 2 = 1): string {
  return `/images/placeholder/${MOTIF[icon ?? ""] ?? "hardware"}-${variant}.svg`;
}
