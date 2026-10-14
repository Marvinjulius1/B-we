import path from "node:path";
import type { ImportReport } from "./importer";

/** Kompakte Konsolenausgabe eines Importlaufs (Details stehen im JSON-Report). */
export function printReport(file: string, r: ImportReport) {
  const errors = r.issues.filter((i) => i.level === "error");
  const warnings = r.issues.filter((i) => i.level === "warning");
  console.log(`\n📦 Import ${path.basename(file)}${r.dryRun ? " (Probelauf)" : ""}`);
  console.log(
    `   ${r.total} Datensätze · ${r.created} neu · ${r.updated} aktualisiert · ${r.unchanged} unverändert · ${r.failed} fehlerhaft` +
      (r.deactivated ? ` · ${r.deactivated} deaktiviert` : ""),
  );
  if (r.brandsCreated.length) console.log(`   Neue Marken: ${r.brandsCreated.join(", ")}`);
  for (const e of errors.slice(0, 25)) {
    console.log(`   ✗ Zeile ${e.row}${e.sku ? ` [${e.sku}]` : ""}${e.field ? ` ${e.field}` : ""}: ${e.message}`);
  }
  if (errors.length > 25) console.log(`   … ${errors.length - 25} weitere Fehler im Report`);
  if (warnings.length) console.log(`   ⚠ ${warnings.length} Warnungen (siehe Report)`);
}
