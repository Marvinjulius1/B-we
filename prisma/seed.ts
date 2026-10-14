/**
 * Seed für die Entwicklung:
 *  1. Kategoriebaum aus data/categories.json (Upsert per Pfad, idempotent)
 *  2. Marken aus data/brands.json
 *  3. Beispielprodukte aus data/seed-products.json – über DIESELBE Importpipeline wie echte Exporte
 *  4. Suchindex neu aufbauen
 *
 *   npm run db:seed
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createPrismaClient } from "../src/server/db";
import { slugify } from "../src/lib/slugify";
import { importProducts, validateRecords } from "../src/server/import/importer";
import { loadAttributeDictionary } from "../src/server/import/dictionary";
import { printReport } from "../src/server/import/report";
import { reindexSearch } from "../src/server/search";
import type { PrismaClient } from "../src/generated/prisma/client";

interface CategoryNode {
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  metaTitle?: string;
  metaDescription?: string;
  filters?: string[];
  linkTo?: string;
  children?: CategoryNode[];
}

const readJson = async <T>(file: string): Promise<T> => JSON.parse(await readFile(path.join(process.cwd(), file), "utf8")) as T;

async function seedCategories(prisma: PrismaClient, nodes: CategoryNode[]) {
  const seen = new Set<string>();
  const walk = async (list: CategoryNode[], parent: { id: string; path: string; icon?: string } | null, depth: number) => {
    for (const [i, node] of list.entries()) {
      const p = parent ? `${parent.path}/${node.slug}` : node.slug;
      seen.add(p);
      const data = {
        slug: node.slug,
        name: node.name,
        description: node.description ?? null,
        icon: node.icon ?? parent?.icon ?? null,
        depth,
        sortOrder: i,
        filterKeys: JSON.stringify(node.filters ?? []),
        metaTitle: node.metaTitle ?? null,
        metaDescription: node.metaDescription ?? null,
        linkToPath: node.linkTo ?? null,
        parentId: parent?.id ?? null,
      };
      const saved = await prisma.category.upsert({ where: { path: p }, create: { path: p, ...data }, update: data });
      if (node.children?.length) await walk(node.children, { id: saved.id, path: p, icon: data.icon ?? undefined }, depth + 1);
    }
  };
  await walk(nodes, null, 0);
  // Kategorien, die nicht mehr in der Datei stehen, ausblenden (nicht löschen – Produktzuordnungen bleiben erhalten)
  const hidden = await prisma.category.updateMany({ where: { path: { notIn: [...seen] } }, data: { isHidden: true } });
  console.log(`✓ ${seen.size} Kategorien${hidden.count ? `, ${hidden.count} ausgeblendet` : ""}`);
}

async function seedBrands(prisma: PrismaClient, brands: { name: string; featured?: boolean }[]) {
  for (const b of brands) {
    const slug = slugify(b.name);
    await prisma.brand.upsert({
      where: { slug },
      create: { slug, name: b.name, featured: !!b.featured },
      update: { name: b.name, featured: !!b.featured },
    });
  }
  console.log(`✓ ${brands.length} Marken`);
}

async function main() {
  const prisma = createPrismaClient();
  try {
    const { categories } = await readJson<{ categories: CategoryNode[] }>("data/categories.json");
    await seedCategories(prisma, categories);

    const { brands } = await readJson<{ brands: { name: string; featured?: boolean }[] }>("data/brands.json");
    await seedBrands(prisma, brands);

    const { products } = await readJson<{ products: Record<string, unknown>[] }>("data/seed-products.json");
    const dict = await loadAttributeDictionary();
    const { valid, issues } = validateRecords(products, dict);
    const report = await importProducts(prisma, valid, issues, products.length, {
      source: "seed:beispiel",
      deactivateMissing: true,
    });
    printReport("data/seed-products.json", report);
    if (report.failed > 0) process.exitCode = 1;

    const n = await reindexSearch(prisma);
    console.log(`✓ Suchindex: ${n} Artikel`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
