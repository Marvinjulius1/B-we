/**
 * Produktimport aus CSV/JSON/XML.
 *
 *   npm run import -- data/export.csv
 *   npm run import -- data/export.xml --source wawi --deactivate-missing
 *   npm run import -- data/export.json --dry-run
 *
 * Optionen:
 *   --source <name>        Kennung der Quelle (Product.source), Default: "import:<dateiname>"
 *   --dry-run              Nur validieren und Änderungen zählen, nichts schreiben
 *   --deactivate-missing   Artikel derselben Quelle, die nicht in der Datei stehen, deaktivieren
 *   --no-create-brands     Unbekannte Marken als Fehler behandeln
 *   --strict               Exit-Code 1, sobald ein Datensatz fehlschlägt
 *
 * Ergebnis: Konsolen-Zusammenfassung + Fehlerreport unter reports/import-<zeitstempel>.json
 */
import "dotenv/config";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { createPrismaClient } from "../src/server/db";
import { detectFormat, parseContent } from "../src/server/import/parsers";
import { importProducts, validateRecords } from "../src/server/import/importer";
import { printReport } from "../src/server/import/report";
import { loadAttributeDictionary } from "../src/server/import/dictionary";
import { reindexSearch } from "../src/server/search";

function parseArgs(argv: string[]) {
  const files: string[] = [];
  const opts = {
    source: undefined as string | undefined,
    dryRun: false,
    deactivateMissing: false,
    createBrands: true,
    strict: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--source") opts.source = argv[++i];
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--deactivate-missing") opts.deactivateMissing = true;
    else if (a === "--no-create-brands") opts.createBrands = false;
    else if (a === "--strict") opts.strict = true;
    else if (a.startsWith("--")) throw new Error(`Unbekannte Option ${a}`);
    else files.push(a);
  }
  return { files, opts };
}

async function main() {
  const { files, opts } = parseArgs(process.argv.slice(2));
  if (files.length === 0) {
    console.error("Aufruf: npm run import -- <datei.csv|json|xml> [--dry-run] [--source name] [--deactivate-missing]");
    process.exit(2);
  }

  const prisma = createPrismaClient();
  const dict = await loadAttributeDictionary();
  let anyFailed = false;

  try {
    for (const file of files) {
      const content = await readFile(file, "utf8");
      const format = detectFormat(file, content);
      const raws = parseContent(format, content);
      const { valid, issues } = validateRecords(raws, dict);
      const report = await importProducts(prisma, valid, issues, raws.length, {
        source: opts.source ?? `import:${path.basename(file)}`,
        dryRun: opts.dryRun,
        deactivateMissing: opts.deactivateMissing,
        createBrands: opts.createBrands,
      });
      printReport(file, report);
      anyFailed ||= report.failed > 0;

      await mkdir("reports", { recursive: true });
      const out = path.join("reports", `import-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
      await writeFile(out, JSON.stringify({ file, format, ...report }, null, 2));
      console.log(`   Report: ${out}`);
    }

    if (!opts.dryRun) {
      const n = await reindexSearch(prisma);
      console.log(`\n🔎 Suchindex neu aufgebaut (${n} Artikel)`);
      await revalidateRunningSite();
    }
  } finally {
    await prisma.$disconnect();
  }

  if (opts.strict && anyFailed) process.exit(1);
}

/** Laufende Next.js-Instanz benachrichtigen (optional, wenn REVALIDATE_SECRET gesetzt ist). */
async function revalidateRunningSite() {
  const secret = process.env.REVALIDATE_SECRET;
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!secret || !base) return;
  try {
    const res = await fetch(new URL("/api/revalidate", base), { method: "POST", headers: { Authorization: `Bearer ${secret}` } });
    console.log(res.ok ? "♻️  Shop-Cache aktualisiert" : `⚠ Cache-Aktualisierung fehlgeschlagen (${res.status})`);
  } catch {
    console.log("ℹ Shop läuft nicht – Cache wird beim nächsten Start ohnehin neu aufgebaut");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
