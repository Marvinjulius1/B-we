/**
 * Erzeugt aus dem Original-Logo (public/brand/boewe-logo.png) alle Marken-Assets:
 *  - public/brand/boewe-logo.svg   (vektorisiert per Potrace, 2 Ebenen: Schattenkante + Orange)
 *  - src/app/icon.png, src/app/apple-icon.png, src/app/favicon.ico (aus dem "b"-Glyph)
 *  - public/brand/og-default.png   (1200x630 Open-Graph-Bild)
 *
 * Aufruf: npm run brand:assets
 * Das Logo wird dabei NICHT verändert – nur nachgezeichnet, Farben 1:1 aus der Pixelanalyse.
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { Potrace } from "potrace";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "public/brand/boewe-logo.png");

// Per Pixel-Analyse bestimmt (häufigste Farbwerte im Logo, siehe docs/DECISIONS.md)
export const BRAND_ORANGE = "#EF7100";
export const BRAND_INK = "#1A1A18";

const SCALE = 4; // Hochskalieren vor dem Tracen glättet die Kurven

type Mask = (r: number, g: number, b: number) => boolean;

const isInk: Mask = (r, g, b) => !(r > 235 && g > 235 && b > 235); // alles Nicht-Weiße
const isOrange: Mask = (r, g, b) => r > 180 && g > 60 && g < 170 && b < 90 && r - b > 120;

async function maskPng(buf: Buffer, w: number, h: number, test: Mask): Promise<Buffer> {
  const out = Buffer.alloc(w * h);
  for (let i = 0, p = 0; i < buf.length; i += 4, p++) {
    out[p] = test(buf[i], buf[i + 1], buf[i + 2]) ? 0 : 255;
  }
  return sharp(out, { raw: { width: w, height: h, channels: 1 } })
    .png()
    .toBuffer();
}

function trace(png: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const p = new Potrace({ turdSize: 8, optTolerance: 0.3, threshold: 128 });
    // Hinweis: Die Typdefinition der Callback-Signatur weicht von der Laufzeit ab (1. Argument = Fehler)
    const onLoad = (err: Error | null) => {
      if (err) return reject(err);
      // Nur das "d"-Attribut, Farbe setzen wir selbst
      const tag = p.getPathTag("black", 1);
      const d = /d="([^"]+)"/.exec(tag)?.[1];
      if (!d) return reject(new Error("Kein Pfad erzeugt"));
      resolve(d);
    };
    p.loadImage(png, onLoad as unknown as Parameters<Potrace["loadImage"]>[1]);
  });
}

async function main() {
  const meta = await sharp(SRC).metadata();
  const W = meta.width! * SCALE;
  const H = meta.height! * SCALE;
  const raw = await sharp(SRC)
    .flatten({ background: "#ffffff" })
    .resize(W, H, { kernel: "lanczos3" })
    .ensureAlpha()
    .raw()
    .toBuffer();

  // Bounding-Box des Logos bestimmen (Weißraum abschneiden)
  let minX = W,
    minY = H,
    maxX = 0,
    maxY = 0;
  for (let i = 0, p = 0; i < raw.length; i += 4, p++) {
    if (isInk(raw[i], raw[i + 1], raw[i + 2])) {
      const x = p % W,
        y = Math.floor(p / W);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  const pad = 2 * SCALE;
  const vb = [minX - pad, minY - pad, maxX - minX + 2 * pad, maxY - minY + 2 * pad];

  const inkD = await trace(await maskPng(raw, W, H, isInk));
  const orangeD = await trace(await maskPng(raw, W, H, isOrange));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(" ")}" role="img" aria-labelledby="t"><title id="t">böwe GmbH</title><path fill="${BRAND_INK}" fill-rule="evenodd" d="${inkD}"/><path fill="${BRAND_ORANGE}" fill-rule="evenodd" d="${orangeD}"/></svg>\n`;
  await writeFile(path.join(ROOT, "public/brand/boewe-logo.svg"), svg);
  console.log(`✓ boewe-logo.svg (viewBox ${vb.join(" ")}, Seitenverhältnis ${(vb[2] / vb[3]).toFixed(3)})`);

  // Icon: das "b" (erstes Glyph, linkes ~22 % des Logos), scharf aus dem SVG gerendert
  const hiRes = await sharp(Buffer.from(svg)).resize({ width: 2400 }).png().toBuffer({ resolveWithObject: true });
  const cropped = await sharp(hiRes.data)
    .extract({ left: 0, top: 0, width: Math.round(hiRes.info.width * 0.222), height: hiRes.info.height })
    .png()
    .toBuffer();
  const glyph = await sharp(cropped).trim({ threshold: 10 }).resize({ width: 400, height: 400, fit: "inside" }).png().toBuffer();
  const base = await sharp({ create: { width: 512, height: 512, channels: 4, background: "#ffffff" } })
    .composite([{ input: glyph, gravity: "center" }])
    .png()
    .toBuffer();
  // sharp wendet resize vor composite an, daher zweistufig
  const icon = (size: number) => sharp(base).resize(size, size).png().toBuffer();

  await mkdir(path.join(ROOT, "src/app"), { recursive: true });
  await writeFile(path.join(ROOT, "src/app/icon.png"), await icon(512));
  await writeFile(path.join(ROOT, "src/app/apple-icon.png"), await icon(180));
  await writeFile(path.join(ROOT, "src/app/favicon.ico"), await pngToIco([await icon(32), await icon(16)]));
  console.log("✓ icon.png, apple-icon.png, favicon.ico");

  // OG-Bild 1200x630: Logo zentriert, Claim darunter
  const logoPng = await sharp(Buffer.from(svg)).resize({ width: 760 }).png().toBuffer();
  const claim = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="#F7F4EF"/>
      <rect y="590" width="1200" height="40" fill="${BRAND_ORANGE}"/>
      <text x="600" y="470" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="700" fill="${BRAND_INK}">Fach- und Großhandel in Aurich · Seit 1924</text>
    </svg>`,
  );
  const og = await sharp(claim)
    .composite([{ input: logoPng, top: 150, left: 220 }])
    .png()
    .toBuffer();
  await writeFile(path.join(ROOT, "public/brand/og-default.png"), og);
  console.log("✓ og-default.png");
}

/** Minimaler ICO-Encoder (PNG-Einträge, von allen modernen Browsern unterstützt). */
async function pngToIco(pngs: Buffer[]): Promise<Buffer> {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const entries: Buffer[] = [];
  let offset = 6 + 16 * pngs.length;
  for (const png of pngs) {
    const { width = 0, height = 0 } = await sharp(png).metadata();
    const e = Buffer.alloc(16);
    e.writeUInt8(width >= 256 ? 0 : width, 0);
    e.writeUInt8(height >= 256 ? 0 : height, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += png.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...pngs]);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
