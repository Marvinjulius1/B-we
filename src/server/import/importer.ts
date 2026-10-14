/**
 * Idempotenter Produktimport.
 *
 *  1. validateRecords(): Rohdaten → normalisieren → zod-Validierung → Fehler/Warnungen je Zeile
 *  2. importProducts(): Upsert per SKU in Transaktionen; unveränderte Datensätze (gleicher Hash) werden übersprungen
 *
 * Mehrfaches Ausführen mit derselben Datei führt zum identischen Datenbestand.
 */
import { createHash } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import { slugify } from "@/lib/slugify";
import { toCents } from "@/lib/money";
import { importProductSchema, type ImportProduct } from "./schema";
import { normalizeRecord, type AttributeDictionary, type RawRecord } from "./normalize";

export type IssueLevel = "error" | "warning";

export interface ImportIssue {
  level: IssueLevel;
  /** 1-basierte Datensatznummer (bei CSV: Zeile ohne Kopfzeile) */
  row: number;
  sku?: string;
  field?: string;
  message: string;
}

export interface ImportReport {
  source: string;
  dryRun: boolean;
  startedAt: string;
  finishedAt?: string;
  total: number;
  valid: number;
  created: number;
  updated: number;
  unchanged: number;
  failed: number;
  deactivated: number;
  brandsCreated: string[];
  issues: ImportIssue[];
}

export interface ValidatedProduct {
  row: number;
  product: ImportProduct;
}

export function validateRecords(
  raws: RawRecord[],
  dict: AttributeDictionary,
): { valid: ValidatedProduct[]; issues: ImportIssue[] } {
  const valid: ValidatedProduct[] = [];
  const issues: ImportIssue[] = [];
  const seen = new Map<string, number>();
  const reportedUnknown = new Set<string>();

  raws.forEach((raw, i) => {
    const row = i + 1;
    const { record, unknownColumns } = normalizeRecord(raw, dict);
    for (const col of unknownColumns) {
      if (!reportedUnknown.has(col)) {
        reportedUnknown.add(col);
        issues.push({ level: "warning", row, field: col, message: `Unbekannte Spalte "${col}" wird ignoriert` });
      }
    }
    const parsed = importProductSchema.safeParse(record);
    const sku = typeof record.sku === "string" ? record.sku : undefined;
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        issues.push({ level: "error", row, sku, field: issue.path.join("."), message: issue.message });
      }
      return;
    }
    const prev = seen.get(parsed.data.sku);
    if (prev !== undefined) {
      issues.push({
        level: "error",
        row,
        sku: parsed.data.sku,
        field: "sku",
        message: `Doppelte SKU (bereits in Datensatz ${prev})`,
      });
      return;
    }
    seen.set(parsed.data.sku, row);
    valid.push({ row, product: parsed.data });
  });

  return { valid, issues };
}

interface CategoryIndex {
  resolve(ref: string): { id: string; path: string } | null;
}

/** Löst Kategorieverweise auf: Slug-Pfad, Namenspfad ("A > B") oder eindeutiger Blattname. */
export function buildCategoryIndex(
  categories: { id: string; path: string; name: string; parentId: string | null; linkToPath: string | null }[],
): CategoryIndex {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const byPath = new Map(categories.map((c) => [c.path, c]));
  const byNamePath = new Map<string, (typeof categories)[number]>();
  const byLeaf = new Map<string, (typeof categories)[number][]>();

  for (const c of categories) {
    const names: string[] = [];
    let cur: (typeof categories)[number] | undefined = c;
    while (cur) {
      names.unshift(slugify(cur.name));
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    byNamePath.set(names.join("/"), c);
    const leafKeys = new Set([slugify(c.name), c.path.split("/").pop()!]);
    for (const k of leafKeys) byLeaf.set(k, [...(byLeaf.get(k) ?? []), c]);
  }

  const follow = (c: (typeof categories)[number]) => {
    const target = c.linkToPath ? byPath.get(c.linkToPath) : undefined;
    const t = target ?? c;
    return { id: t.id, path: t.path };
  };

  return {
    resolve(ref: string) {
      const key = ref
        .split(/\s*(?:>|\/|»|›)\s*/)
        .map((s) => slugify(s))
        .filter(Boolean)
        .join("/");
      const hit = byPath.get(key) ?? byNamePath.get(key);
      if (hit) return follow(hit);
      if (!key.includes("/")) {
        const leaves = byLeaf.get(key);
        if (leaves?.length === 1) return follow(leaves[0]);
      }
      return null;
    },
  };
}

function hashProduct(p: ImportProduct, resolved: unknown): string {
  return createHash("sha1").update(JSON.stringify({ p, resolved })).digest("hex");
}

export interface ImportOptions {
  /** Kennung der Datenquelle, wird in Product.source geschrieben (Default: "import") */
  source?: string;
  dryRun?: boolean;
  /** Artikel derselben Quelle, die nicht mehr in der Datei stehen, deaktivieren */
  deactivateMissing?: boolean;
  /** Unbekannte Marken automatisch anlegen (Default: true, mit Warnung) */
  createBrands?: boolean;
}

export async function importProducts(
  prisma: PrismaClient,
  items: ValidatedProduct[],
  issues: ImportIssue[],
  total: number,
  options: ImportOptions = {},
): Promise<ImportReport> {
  const source = options.source ?? "import";
  const report: ImportReport = {
    source,
    dryRun: !!options.dryRun,
    startedAt: new Date().toISOString(),
    total,
    valid: items.length,
    created: 0,
    updated: 0,
    unchanged: 0,
    failed: total - items.length,
    deactivated: 0,
    brandsCreated: [],
    issues,
  };

  const categoryIndex = buildCategoryIndex(
    await prisma.category.findMany({ select: { id: true, path: true, name: true, parentId: true, linkToPath: true } }),
  );

  // Marken
  const brands = new Map((await prisma.brand.findMany({ select: { id: true, name: true, slug: true } })).map((b) => [b.slug, b]));
  const brandIdFor = async (name: string | undefined, row: number, sku: string): Promise<string | null | false> => {
    if (!name) return null;
    const slug = slugify(name);
    const existing = brands.get(slug);
    if (existing) return existing.id;
    if (options.createBrands === false) {
      issues.push({ level: "error", row, sku, field: "brand", message: `Unbekannte Marke "${name}"` });
      return false;
    }
    issues.push({ level: "warning", row, sku, field: "brand", message: `Marke "${name}" wird neu angelegt` });
    report.brandsCreated.push(name);
    if (options.dryRun) {
      const fake = { id: `dry-${slug}`, name, slug };
      brands.set(slug, fake);
      return fake.id;
    }
    const created = await prisma.brand.create({ data: { name, slug }, select: { id: true, name: true, slug: true } });
    brands.set(slug, created);
    return created.id;
  };

  // Bestehende Artikel (für Slug-Kollisionen und Hash-Vergleich)
  const existing = new Map(
    (await prisma.product.findMany({ select: { id: true, sku: true, slug: true, importHash: true } })).map((p) => [p.sku, p]),
  );
  const slugOwner = new Map([...existing.values()].map((p) => [p.slug, p.sku]));

  const toRelate: { productSku: string; related: string[]; row: number }[] = [];

  for (const { row, product: p } of items) {
    try {
      const categoryRefs: { id: string; path: string }[] = [];
      let categoryError = false;
      for (const ref of p.categories) {
        const c = categoryIndex.resolve(ref);
        if (!c) {
          issues.push({ level: "error", row, sku: p.sku, field: "categories", message: `Kategorie "${ref}" nicht gefunden` });
          categoryError = true;
        } else if (!categoryRefs.some((x) => x.id === c.id)) {
          categoryRefs.push(c);
        }
      }
      if (categoryError) {
        report.failed++;
        continue;
      }

      const brandId = await brandIdFor(p.brand, row, p.sku);
      if (brandId === false) {
        report.failed++;
        continue;
      }

      // Slug: explizit oder aus Name; bei Kollision mit anderer SKU wird die SKU angehängt
      let slug = slugify(p.slug ?? p.name);
      const owner = slugOwner.get(slug);
      if (owner && owner !== p.sku) slug = `${slug}-${slugify(p.sku)}`;
      slugOwner.set(slug, p.sku);

      const hash = hashProduct(p, { categoryRefs, brandId, slug, source });
      const prev = existing.get(p.sku);
      if (prev?.importHash === hash) {
        report.unchanged++;
        continue;
      }

      if (p.related.length) toRelate.push({ productSku: p.sku, related: p.related, row });
      if (p.images.length === 0) {
        issues.push({ level: "warning", row, sku: p.sku, field: "images", message: "Keine Bilder – Platzhalter wird angezeigt" });
      }

      if (options.dryRun) {
        if (prev) report.updated++;
        else report.created++;
        continue;
      }

      const data = {
        slug,
        name: p.name,
        shortDescription: p.shortDescription ?? null,
        description: p.description ?? null,
        priceGrossCents: toCents(p.priceGross),
        compareAtPriceCents: p.compareAtPrice !== undefined ? toCents(p.compareAtPrice) : null,
        taxRate: p.taxRate,
        unit: p.unit,
        shippingClass: p.shippingClass,
        weightGrams: p.weightGrams ?? null,
        stockStatus: p.stockStatus,
        stockQuantity: p.stockQuantity ?? null,
        deliveryTime: p.deliveryTime ?? null,
        ean: p.ean ?? null,
        mpn: p.mpn ?? null,
        variantGroup: p.variantGroup ?? null,
        isActive: p.isActive,
        isNew: p.isNew,
        isBestseller: p.isBestseller,
        isTopProduct: p.isTopProduct,
        isClearance: p.isClearance,
        containsBattery: p.containsBattery,
        metaTitle: p.metaTitle ?? null,
        metaDescription: p.metaDescription ?? null,
        source: p.source ?? source,
        rights: p.rights ?? null,
        importedAt: new Date(),
        importHash: hash,
        brandId,
      };

      await prisma.$transaction(async (tx) => {
        const saved = await tx.product.upsert({
          where: { sku: p.sku },
          create: { sku: p.sku, ...data },
          update: data,
          select: { id: true },
        });
        await tx.productAttribute.deleteMany({ where: { productId: saved.id } });
        if (p.attributes.length) {
          await tx.productAttribute.createMany({
            data: p.attributes.map((a, i) => ({
              productId: saved.id,
              key: a.key,
              label: a.label ?? a.key,
              value: a.value,
              unit: a.unit ?? null,
              numericValue: numericOf(a.value),
              sortOrder: i,
              isVariantAxis: a.variantAxis,
            })),
          });
        }
        await tx.productImage.deleteMany({ where: { productId: saved.id } });
        if (p.images.length) {
          await tx.productImage.createMany({
            data: p.images.map((img, i) => ({
              productId: saved.id,
              url: img.url,
              alt: img.alt ?? p.name,
              sortOrder: i,
              source: img.source ?? null,
              rights: img.rights ?? p.rights ?? null,
            })),
          });
        }
        await tx.productCategory.deleteMany({ where: { productId: saved.id } });
        await tx.productCategory.createMany({
          data: categoryRefs.map((c, i) => ({ productId: saved.id, categoryId: c.id, isPrimary: i === 0, sortOrder: i })),
        });
        existing.set(p.sku, { id: saved.id, sku: p.sku, slug, importHash: hash });
      });

      if (prev) report.updated++;
      else report.created++;
    } catch (err) {
      report.failed++;
      issues.push({ level: "error", row, sku: p.sku, message: `Speichern fehlgeschlagen: ${(err as Error).message}` });
    }
  }

  // Zweiter Durchlauf: "Passend dazu"-Beziehungen (Ziel-SKUs müssen existieren)
  if (!options.dryRun) {
    for (const { productSku, related, row } of toRelate) {
      const from = existing.get(productSku);
      if (!from) continue;
      await prisma.productRelation.deleteMany({ where: { fromId: from.id, type: "ACCESSORY" } });
      const targets = related
        .map((sku, i) => ({ sku, i, target: existing.get(sku) }))
        .filter((r) => {
          if (!r.target) {
            issues.push({
              level: "warning",
              row,
              sku: productSku,
              field: "related",
              message: `Zubehör-SKU "${r.sku}" unbekannt`,
            });
          }
          return !!r.target && r.target.id !== from.id;
        });
      if (targets.length) {
        await prisma.productRelation.createMany({
          data: targets.map((t) => ({ fromId: from.id, toId: t.target!.id, type: "ACCESSORY", sortOrder: t.i })),
        });
      }
    }

    if (options.deactivateMissing) {
      const skus = items.map((i) => i.product.sku);
      const res = await prisma.product.updateMany({
        where: { source, sku: { notIn: skus }, isActive: true },
        data: { isActive: false },
      });
      report.deactivated = res.count;
    }
  }

  report.finishedAt = new Date().toISOString();
  return report;
}

/** "30 x 30" → 30, "1.000 mm" → 1000, "12,5" → 12.5 – erste Zahl im Text für Bereichsfilter. */
export function numericOf(value: string): number | null {
  const m = /-?\d+(?:[.,]\d+)?/.exec(value.replace(/(\d)\.(\d{3})\b/g, "$1$2"));
  if (!m) return null;
  return Number(m[0].replace(",", "."));
}
