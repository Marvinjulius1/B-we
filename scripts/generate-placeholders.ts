/**
 * Erzeugt neutrale, selbst gezeichnete Produkt-Platzhalter (SVG) – keine Fremdbilder, keine Rechtefragen.
 * Je Motiv zwei Varianten: "-1" (hell, Gesamtansicht) und "-2" (dunkel, Detail) für den Bildwechsel bei Hover.
 *
 *   npm run placeholders
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "public/images/placeholder");
const ORANGE = "#EF7100";

/** Piktogramme in einem 400×400-Raster. `c` = Akzentfarbe, `k` = Linienfarbe. */
const MOTIFS: Record<string, (c: string, k: string) => string> = {
  grating: (c, k) => {
    let s = `<rect x="60" y="90" width="280" height="220" rx="6" fill="none" stroke="${k}" stroke-width="14"/>`;
    for (let x = 100; x < 340; x += 40) s += `<line x1="${x}" y1="90" x2="${x}" y2="310" stroke="${k}" stroke-width="8"/>`;
    for (let y = 130; y < 310; y += 40) s += `<line x1="60" y1="${y}" x2="340" y2="${y}" stroke="${c}" stroke-width="6"/>`;
    return s;
  },
  hardware: (c, k) =>
    `<path d="M200 70 l70 40 v80 l-70 40 l-70 -40 v-80z" fill="none" stroke="${k}" stroke-width="14" stroke-linejoin="round"/><circle cx="200" cy="150" r="28" fill="${c}"/><rect x="185" y="230" width="30" height="110" rx="6" fill="${k}"/><path d="M185 255 h30 M185 280 h30 M185 305 h30" stroke="${c}" stroke-width="6"/>`,
  chain: (c, k) =>
    [0, 1, 2, 3]
      .map(
        (i) =>
          `<rect x="${70 + i * 66}" y="${i % 2 ? 175 : 160}" width="100" height="${i % 2 ? 50 : 80}" rx="${i % 2 ? 25 : 40}" fill="none" stroke="${i % 2 ? c : k}" stroke-width="16"/>`,
      )
      .join(""),
  garden: (c, k) =>
    `<line x1="110" y1="320" x2="290" y2="90" stroke="${k}" stroke-width="16" stroke-linecap="round"/><rect x="230" y="70" width="90" height="50" rx="12" transform="rotate(-52 275 95)" fill="${c}"/><path d="M90 330 q30 -60 70 -30" fill="none" stroke="${c}" stroke-width="14" stroke-linecap="round"/><circle cx="160" cy="250" r="16" fill="${k}"/>`,
  saw: (c, k) =>
    `<rect x="70" y="160" width="130" height="90" rx="18" fill="${c}"/><path d="M200 175 h140 a30 30 0 0 1 0 60 h-140z" fill="none" stroke="${k}" stroke-width="14"/><path d="M215 175 l10 -12 l10 12 l10 -12 l10 12 l10 -12 l10 12 l10 -12 l10 12" fill="none" stroke="${k}" stroke-width="6"/><rect x="95" y="120" width="70" height="40" rx="10" fill="none" stroke="${k}" stroke-width="12"/>`,
  mower: (c, k) =>
    `<rect x="90" y="190" width="220" height="80" rx="20" fill="${c}"/><circle cx="125" cy="290" r="30" fill="${k}"/><circle cx="275" cy="290" r="30" fill="${k}"/><line x1="290" y1="200" x2="340" y2="90" stroke="${k}" stroke-width="14" stroke-linecap="round"/><line x1="320" y1="90" x2="360" y2="90" stroke="${k}" stroke-width="14" stroke-linecap="round"/>`,
  tool: (c, k) =>
    `<rect x="185" y="60" width="30" height="190" rx="10" fill="${k}"/><path d="M150 250 h100 l-15 90 h-70z" fill="${c}"/><rect x="160" y="50" width="80" height="26" rx="13" fill="${k}"/>`,
  hose: (c, k) =>
    `<circle cx="200" cy="200" r="120" fill="none" stroke="${c}" stroke-width="18"/><circle cx="200" cy="200" r="85" fill="none" stroke="${c}" stroke-width="18"/><circle cx="200" cy="200" r="50" fill="none" stroke="${k}" stroke-width="18"/><rect x="300" y="290" width="60" height="30" rx="8" fill="${k}"/>`,
  ladder: (c, k) => {
    let s = `<line x1="140" y1="60" x2="110" y2="340" stroke="${k}" stroke-width="16" stroke-linecap="round"/><line x1="260" y1="60" x2="290" y2="340" stroke="${k}" stroke-width="16" stroke-linecap="round"/>`;
    for (let i = 0; i < 6; i++) {
      const y = 95 + i * 45;
      const off = (y - 60) * 0.107;
      s += `<line x1="${140 - off}" y1="${y}" x2="${260 + off}" y2="${y}" stroke="${c}" stroke-width="12"/>`;
    }
    return s;
  },
  light: (c, k) =>
    `<rect x="110" y="90" width="180" height="140" rx="16" fill="none" stroke="${k}" stroke-width="14"/><rect x="135" y="115" width="130" height="90" rx="8" fill="${c}"/><line x1="200" y1="230" x2="200" y2="300" stroke="${k}" stroke-width="14"/><path d="M130 340 l70 -40 l70 40" fill="none" stroke="${k}" stroke-width="14" stroke-linecap="round"/>`,
  heater: (c, k) =>
    `<rect x="80" y="100" width="240" height="180" rx="14" fill="none" stroke="${k}" stroke-width="14"/><path d="M120 240 q20 -40 0 -80 M170 240 q20 -40 0 -80 M220 240 q20 -40 0 -80 M270 240 q20 -40 0 -80" fill="none" stroke="${c}" stroke-width="12" stroke-linecap="round"/>`,
  electric: (c, k) =>
    `<rect x="110" y="70" width="180" height="260" rx="30" fill="none" stroke="${k}" stroke-width="14"/><path d="M215 110 l-55 100 h45 l-20 85 l65 -110 h-45z" fill="${c}"/>`,
  workwear: (c, k) =>
    `<path d="M150 80 l-80 50 l30 70 l30 -15 v145 h140 v-145 l30 15 l30 -70 l-80 -50 q-50 40 -100 0z" fill="${c}" stroke="${k}" stroke-width="12" stroke-linejoin="round"/><line x1="200" y1="110" x2="200" y2="330" stroke="${k}" stroke-width="8"/><rect x="140" y="190" width="40" height="35" rx="4" fill="none" stroke="${k}" stroke-width="7"/>`,
  shoe: (c, k) =>
    `<path d="M80 290 v-120 q0 -30 30 -30 h60 l20 60 q70 10 120 40 q30 20 30 50 z" fill="${c}" stroke="${k}" stroke-width="12" stroke-linejoin="round"/><rect x="72" y="290" width="276" height="30" rx="10" fill="${k}"/>`,
  ppe: (c, k) =>
    `<path d="M80 250 a120 120 0 0 1 240 0 z" fill="${c}" stroke="${k}" stroke-width="12"/><rect x="60" y="245" width="280" height="28" rx="14" fill="${k}"/><rect x="185" y="135" width="30" height="110" rx="10" fill="${k}" opacity=".35"/>`,
  lock: (c, k) =>
    `<path d="M140 180 v-45 a60 60 0 0 1 120 0 v45" fill="none" stroke="${k}" stroke-width="18"/><rect x="100" y="175" width="200" height="160" rx="22" fill="${c}"/><circle cx="200" cy="240" r="18" fill="${k}"/><rect x="192" y="248" width="16" height="45" rx="6" fill="${k}"/>`,
  safe: (c, k) =>
    `<rect x="80" y="80" width="240" height="240" rx="18" fill="none" stroke="${k}" stroke-width="14"/><circle cx="200" cy="200" r="58" fill="${c}"/><circle cx="200" cy="200" r="18" fill="${k}"/><path d="M200 142 v-12 M258 200 h12 M200 258 v12 M142 200 h-12" stroke="${k}" stroke-width="8"/>`,
  camera: (c, k) =>
    `<rect x="90" y="140" width="190" height="90" rx="20" fill="${c}"/><circle cx="280" cy="185" r="38" fill="${k}"/><circle cx="280" cy="185" r="16" fill="${c}"/><path d="M150 230 v60 h-60" fill="none" stroke="${k}" stroke-width="14" stroke-linecap="round"/>`,
  door: (c, k) =>
    `<rect x="120" y="60" width="160" height="280" rx="8" fill="none" stroke="${k}" stroke-width="14"/><rect x="245" y="190" width="70" height="20" rx="10" fill="${c}"/><circle cx="250" cy="200" r="16" fill="${c}"/><rect x="243" y="225" width="14" height="30" rx="5" fill="${k}"/>`,
  fence: (c, k) => {
    let s = "";
    for (let x = 80; x <= 320; x += 40) s += `<line x1="${x}" y1="90" x2="${x}" y2="320" stroke="${k}" stroke-width="10"/>`;
    s += `<line x1="60" y1="140" x2="340" y2="140" stroke="${c}" stroke-width="16"/><line x1="60" y1="270" x2="340" y2="270" stroke="${c}" stroke-width="16"/>`;
    return s;
  },
  drill: (c, k) =>
    `<path d="M90 130 h170 a40 40 0 0 1 0 80 h-90 l-20 110 h-50 l10 -110 h-20z" fill="${c}" stroke="${k}" stroke-width="10" stroke-linejoin="round"/><rect x="295" y="158" width="70" height="24" rx="6" fill="${k}"/><rect x="110" y="300" width="80" height="40" rx="8" fill="${k}"/>`,
  scaffold: (c, k) => {
    let s = `<line x1="120" y1="60" x2="120" y2="320" stroke="${k}" stroke-width="14"/><line x1="280" y1="60" x2="280" y2="320" stroke="${k}" stroke-width="14"/>`;
    for (const y of [100, 190, 280]) s += `<rect x="110" y="${y}" width="180" height="16" fill="${c}"/>`;
    s += `<line x1="120" y1="190" x2="280" y2="100" stroke="${k}" stroke-width="8"/><line x1="120" y1="280" x2="280" y2="190" stroke="${k}" stroke-width="8"/>`;
    s += `<circle cx="120" cy="335" r="14" fill="${k}"/><circle cx="280" cy="335" r="14" fill="${k}"/>`;
    return s;
  },
  gutter: (c, k) =>
    `<path d="M70 140 h260 v20 a110 110 0 0 1 -260 0 z" fill="${c}" stroke="${k}" stroke-width="12"/><path d="M180 255 v80 h40 v-80" fill="none" stroke="${k}" stroke-width="12"/>`,
  pipe: (c, k) =>
    `<rect x="60" y="160" width="230" height="80" fill="${c}" stroke="${k}" stroke-width="10"/><rect x="280" y="145" width="70" height="110" rx="6" fill="${c}" stroke="${k}" stroke-width="10"/><ellipse cx="60" cy="200" rx="18" ry="40" fill="${k}"/>`,
  construction: (c, k) =>
    `<path d="M200 70 l120 230 h-240z" fill="${c}" stroke="${k}" stroke-width="12" stroke-linejoin="round"/><path d="M155 220 h90 M175 170 h50" stroke="${k}" stroke-width="16"/><rect x="60" y="300" width="280" height="30" rx="6" fill="${k}"/>`,
  trailer: (c, k) =>
    `<rect x="70" y="150" width="210" height="110" rx="10" fill="${c}" stroke="${k}" stroke-width="12"/><line x1="280" y1="240" x2="350" y2="240" stroke="${k}" stroke-width="14" stroke-linecap="round"/><circle cx="355" cy="240" r="12" fill="${k}"/><circle cx="175" cy="285" r="34" fill="${k}"/>`,
};

function svg(motif: string, variant: 1 | 2): string {
  const draw = MOTIFS[motif];
  const light = variant === 1;
  const bg = light ? "#F4F1EC" : "#1E1D1B";
  const grid = light ? "#E6E1D9" : "#2A2826";
  const ink = light ? "#1A1A18" : "#F4F1EC";
  // Variante 2: leicht vergrößert und versetzt ("Detailansicht")
  const transform = light ? "translate(140 140) scale(1.3)" : "translate(40 40) scale(1.8)";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
<defs><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="${grid}" stroke-width="1"/></pattern></defs>
<rect width="800" height="800" fill="${bg}"/><rect width="800" height="800" fill="url(#g)"/>
<g transform="${transform}">${draw(ORANGE, ink)}</g>
</svg>
`;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  for (const motif of Object.keys(MOTIFS)) {
    await writeFile(path.join(OUT, `${motif}-1.svg`), svg(motif, 1));
    await writeFile(path.join(OUT, `${motif}-2.svg`), svg(motif, 2));
  }
  // Allgemeiner Fallback für Artikel ohne Bild
  await writeFile(path.join(OUT, "default-1.svg"), svg("hardware", 1));
  console.log(`✓ ${Object.keys(MOTIFS).length * 2 + 1} Platzhalter in public/images/placeholder`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
