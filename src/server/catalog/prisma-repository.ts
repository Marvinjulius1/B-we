/**
 * CatalogRepository auf Basis von Prisma (SQLite/PostgreSQL).
 *
 * Facettierung: Die Grundmenge (Kategorie-Teilbaum ∩ Suchtreffer ∩ Flag) wird schlank geladen und
 * Filter/Facetten werden im Speicher berechnet. Das hält Facetten-Zähler exakt (Varianten werden
 * als ein Artikel gezählt) und ist bis in den Bereich von ~20.000 Artikeln je Kategorie unkritisch.
 * Darüber hinaus übernimmt idealerweise eine Suchmaschine (z. B. Meilisearch) die Facetten – siehe DECISIONS.
 */
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import attributeDictionary from "../../../data/attributes.json";
import {
  deliveryTimeFor,
  isShippingClass,
  isStockStatus,
  PAGE_SIZE,
  type ShippingClass,
  type StockStatus,
} from "@/lib/catalog-constants";
import { normalizeGerman } from "@/server/search/sqlite-fts";
import type { SearchProvider } from "@/server/search/types";
import type {
  BrandSummary,
  CatalogRepository,
  CategoryDetail,
  CategoryNode,
  Facet,
  FacetValue,
  ProductCard,
  ProductDetail,
  ProductListResult,
  ProductQuery,
  SuggestResult,
} from "./types";

const DICT = attributeDictionary.attributes as Record<string, { label: string; unit?: string; type?: string }>;
const FALLBACK_IMAGE = { url: "/images/placeholder/default-1.svg", alt: "Produktbild folgt" };

const cardSelect = {
  id: true,
  sku: true,
  slug: true,
  name: true,
  priceGrossCents: true,
  compareAtPriceCents: true,
  unit: true,
  stockStatus: true,
  shippingClass: true,
  deliveryTime: true,
  isNew: true,
  isBestseller: true,
  isClearance: true,
  variantGroup: true,
  brand: { select: { name: true, slug: true } },
  images: { select: { url: true, alt: true }, orderBy: { sortOrder: "asc" }, take: 2 },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

function toCard(p: CardRow, extra?: { priceFromCents?: number | null; variantCount?: number }): ProductCard {
  const stockStatus: StockStatus = isStockStatus(p.stockStatus) ? p.stockStatus : "IN_STOCK";
  const shippingClass: ShippingClass = isShippingClass(p.shippingClass) ? p.shippingClass : "PAKET";
  return {
    id: p.id,
    sku: p.sku,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    priceGrossCents: p.priceGrossCents,
    compareAtPriceCents: p.compareAtPriceCents,
    priceFromCents: extra?.priceFromCents ?? null,
    variantCount: extra?.variantCount ?? 1,
    unit: p.unit,
    stockStatus,
    shippingClass,
    deliveryTime: deliveryTimeFor(shippingClass, p.deliveryTime),
    images: p.images.length ? p.images : [FALLBACK_IMAGE],
    isNew: p.isNew,
    isBestseller: p.isBestseller,
    isClearance: p.isClearance,
  };
}

/** Sortiert Facettenwerte numerisch, wenn möglich ("30 x 30" < "34 x 38"), sonst alphabetisch. */
function compareValues(a: string, b: string): number {
  const na = parseFloat(a.replace(",", "."));
  const nb = parseFloat(b.replace(",", "."));
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;
  return a.localeCompare(b, "de", { numeric: true });
}

const groupKey = (r: { id: string; variantGroup: string | null }) => r.variantGroup ?? r.id;

export class PrismaCatalogRepository implements CatalogRepository {
  constructor(
    private prisma: PrismaClient,
    private search: SearchProvider,
  ) {}

  // ---------------------------------------------------------------- Kategorien

  async getCategoryTree(): Promise<CategoryNode[]> {
    const [cats, links] = await Promise.all([
      this.prisma.category.findMany({
        where: { isHidden: false },
        orderBy: [{ depth: "asc" }, { sortOrder: "asc" }],
      }),
      this.prisma.productCategory.findMany({
        where: { product: { isActive: true } },
        select: { productId: true, categoryId: true, product: { select: { variantGroup: true } } },
      }),
    ]);

    const parentOf = new Map(cats.map((c) => [c.id, c.parentId]));
    const members = new Map<string, Set<string>>();
    for (const l of links) {
      const key = l.product.variantGroup ?? l.productId;
      let cur: string | null | undefined = l.categoryId;
      while (cur) {
        if (!members.has(cur)) members.set(cur, new Set());
        members.get(cur)!.add(key);
        cur = parentOf.get(cur);
      }
    }

    const nodes = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];
    for (const c of cats) {
      const node: CategoryNode = {
        id: c.id,
        slug: c.slug,
        path: c.path,
        name: c.name,
        description: c.description,
        icon: c.icon,
        depth: c.depth,
        href: `/shop/${c.linkToPath ?? c.path}`,
        productCount: members.get(c.id)?.size ?? 0,
        children: [],
      };
      nodes.set(c.id, node);
      const parent = c.parentId ? nodes.get(c.parentId) : undefined;
      if (parent) parent.children.push(node);
      else if (!c.parentId) roots.push(node);
    }
    // Querverweise zählen wie ihr Ziel
    for (const c of cats) {
      if (!c.linkToPath) continue;
      const target = cats.find((t) => t.path === c.linkToPath);
      const node = nodes.get(c.id);
      if (target && node) node.productCount = members.get(target.id)?.size ?? 0;
    }
    return roots;
  }

  async getCategory(path: string): Promise<CategoryDetail | null> {
    const [tree, raw] = await Promise.all([this.getCategoryTree(), this.prisma.category.findUnique({ where: { path } })]);
    if (!raw || raw.isHidden) return null;

    const trail: CategoryNode[] = [];
    const find = (list: CategoryNode[]): boolean => {
      for (const n of list) {
        trail.push(n);
        if (n.path === path) return true;
        if (find(n.children)) return true;
        trail.pop();
      }
      return false;
    };
    if (!find(tree)) return null;
    const node = trail[trail.length - 1];
    const parent = trail[trail.length - 2];

    // Wirksame Filter: eigene, sonst vom nächsten Vorfahren
    const ancestorsRaw = await this.prisma.category.findMany({
      where: { path: { in: trail.map((t) => t.path) } },
      select: { path: true, filterKeys: true },
    });
    const filterByPath = new Map(ancestorsRaw.map((a) => [a.path, JSON.parse(a.filterKeys) as string[]]));
    let filterKeys: string[] = [];
    for (let i = trail.length - 1; i >= 0; i--) {
      const f = filterByPath.get(trail[i].path);
      if (f && f.length) {
        filterKeys = f;
        break;
      }
    }

    return {
      ...node,
      metaTitle: raw.metaTitle,
      metaDescription: raw.metaDescription,
      filterKeys,
      ancestors: trail.slice(0, -1).map((t) => ({ name: t.name, path: t.path })),
      children: node.children,
      siblings: parent ? parent.children : tree,
    };
  }

  private async subtreeIds(path: string): Promise<string[]> {
    const cats = await this.prisma.category.findMany({
      where: { OR: [{ path }, { path: { startsWith: `${path}/` } }] },
      select: { id: true },
    });
    return cats.map((c) => c.id);
  }

  // ---------------------------------------------------------------- Listen & Facetten

  async listProducts(query: ProductQuery): Promise<ProductListResult> {
    const pageSize = query.pageSize ?? PAGE_SIZE;
    const empty: ProductListResult = {
      items: [],
      total: 0,
      page: 1,
      pageSize,
      pageCount: 0,
      facets: [],
      brandFacet: [],
      inStockCount: 0,
      priceRange: null,
    };

    let filterKeys: string[] = [];
    const where: Prisma.ProductWhereInput = { isActive: true };

    if (query.categoryPath) {
      const cat = await this.getCategory(query.categoryPath);
      if (!cat) return empty;
      filterKeys = cat.filterKeys;
      where.categories = { some: { categoryId: { in: await this.subtreeIds(query.categoryPath) } } };
    }
    if (query.flag) where[query.flag] = true;
    if (query.brandSlug) where.brand = { slug: query.brandSlug };

    let scores: Map<string, number> | null = null;
    if (query.q?.trim()) {
      const hits = await this.search.search(query.q, { limit: 1000 });
      if (hits.length === 0) return empty;
      scores = new Map(hits.map((h) => [h.id, h.score]));
      where.id = { in: [...scores.keys()] };
    }

    const rows = await this.prisma.product.findMany({
      where,
      select: {
        id: true,
        variantGroup: true,
        priceGrossCents: true,
        stockStatus: true,
        name: true,
        createdAt: true,
        isTopProduct: true,
        isBestseller: true,
        brand: { select: { slug: true, name: true } },
        attributes: { where: { key: { in: filterKeys } }, select: { key: true, value: true } },
      },
    });
    if (rows.length === 0) return empty;

    type Row = (typeof rows)[number];
    const attrValue = (r: Row, key: string) => r.attributes.find((a) => a.key === key)?.value;

    // Prädikate je Filterdimension – Facetten ignorieren jeweils ihre eigene Dimension
    const preds: Record<string, (r: Row) => boolean> = {};
    if (query.brands?.length) preds.brand = (r) => !!r.brand && query.brands!.includes(r.brand.slug);
    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      preds.price = (r) =>
        (query.priceMin === undefined || r.priceGrossCents >= query.priceMin) &&
        (query.priceMax === undefined || r.priceGrossCents <= query.priceMax);
    }
    if (query.inStockOnly) preds.stock = (r) => r.stockStatus === "IN_STOCK" || r.stockStatus === "LOW_STOCK";
    for (const [key, values] of Object.entries(query.attributes ?? {})) {
      if (!values.length || !filterKeys.includes(key)) continue;
      preds[`attr:${key}`] = (r) => {
        const v = attrValue(r, key);
        return v !== undefined && values.includes(v);
      };
    }
    const pass = (r: Row, skip?: string) => Object.entries(preds).every(([k, p]) => k === skip || p(r));

    // Facetten (Varianten = ein Artikel)
    const countDistinct = (list: Row[], valueOf: (r: Row) => string | undefined) => {
      const m = new Map<string, Set<string>>();
      for (const r of list) {
        const v = valueOf(r);
        if (v === undefined) continue;
        if (!m.has(v)) m.set(v, new Set());
        m.get(v)!.add(groupKey(r));
      }
      return m;
    };

    const facets: Facet[] = filterKeys
      .map((key) => {
        const counts = countDistinct(
          rows.filter((r) => pass(r, `attr:${key}`)),
          (r) => attrValue(r, key),
        );
        const selected = query.attributes?.[key] ?? [];
        const values: FacetValue[] = [...new Set([...counts.keys(), ...selected])]
          .sort(compareValues)
          .map((v) => ({ value: v, label: v, count: counts.get(v)?.size ?? 0, selected: selected.includes(v) }));
        return { key, label: DICT[key]?.label ?? key, unit: DICT[key]?.unit ?? null, values };
      })
      // Facetten mit nur einem Wert helfen beim Filtern nicht (außer sie sind aktiv)
      .filter((f) => f.values.length > 1 || f.values.some((v) => v.selected));

    const brandCounts = new Map<string, { name: string; groups: Set<string> }>();
    for (const r of rows.filter((x) => pass(x, "brand"))) {
      if (!r.brand) continue;
      if (!brandCounts.has(r.brand.slug)) brandCounts.set(r.brand.slug, { name: r.brand.name, groups: new Set() });
      brandCounts.get(r.brand.slug)!.groups.add(groupKey(r));
    }
    const brandFacet: FacetValue[] = [...brandCounts.entries()]
      .map(([slug, b]) => ({ value: slug, label: b.name, count: b.groups.size, selected: !!query.brands?.includes(slug) }))
      .sort((a, b) => a.label.localeCompare(b.label, "de"));

    const inStockCount = new Set(
      rows.filter((r) => pass(r, "stock") && (r.stockStatus === "IN_STOCK" || r.stockStatus === "LOW_STOCK")).map(groupKey),
    ).size;

    const priceBase = rows.filter((r) => pass(r, "price"));
    const priceRange = priceBase.length
      ? {
          min: Math.min(...priceBase.map((r) => r.priceGrossCents)),
          max: Math.max(...priceBase.map((r) => r.priceGrossCents)),
        }
      : null;

    // Treffer sortieren und Varianten zusammenfassen
    const matching = rows.filter((r) => pass(r));
    const sort = query.sort ?? "relevanz";
    const byName = (a: Row, b: Row) => a.name.localeCompare(b.name, "de", { numeric: true });
    matching.sort((a, b) => {
      switch (sort) {
        case "preis-auf":
          return a.priceGrossCents - b.priceGrossCents || byName(a, b);
        case "preis-ab":
          return b.priceGrossCents - a.priceGrossCents || byName(a, b);
        case "name":
          return byName(a, b);
        case "neu":
          return b.createdAt.getTime() - a.createdAt.getTime() || byName(a, b);
        default:
          if (scores) return (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0);
          return (
            Number(b.isTopProduct) - Number(a.isTopProduct) || Number(b.isBestseller) - Number(a.isBestseller) || byName(a, b)
          );
      }
    });

    const groups = new Map<string, { id: string; minPrice: number; count: number }>();
    for (const r of matching) {
      const k = groupKey(r);
      const g = groups.get(k);
      if (g) {
        g.count++;
        g.minPrice = Math.min(g.minPrice, r.priceGrossCents);
      } else {
        groups.set(k, { id: r.id, minPrice: r.priceGrossCents, count: 1 });
      }
    }
    const collapsed = [...groups.values()];
    const total = collapsed.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(Math.max(1, query.page ?? 1), pageCount);
    const slice = collapsed.slice((page - 1) * pageSize, page * pageSize);

    const cards = await this.prisma.product.findMany({ where: { id: { in: slice.map((s) => s.id) } }, select: cardSelect });
    const byId = new Map(cards.map((c) => [c.id, c]));
    const items = slice
      .map((s) => {
        const c = byId.get(s.id);
        if (!c) return null;
        return toCard(c, { variantCount: s.count, priceFromCents: s.count > 1 ? s.minPrice : null });
      })
      .filter((c): c is ProductCard => c !== null);

    return { items, total, page, pageSize, pageCount, facets, brandFacet, inStockCount, priceRange };
  }

  async getFlaggedProducts(flag: NonNullable<ProductQuery["flag"]>, limit: number): Promise<ProductCard[]> {
    const res = await this.listProducts({ flag, pageSize: limit });
    return res.items;
  }

  // ---------------------------------------------------------------- Produkt

  async getProduct(slug: string): Promise<ProductDetail | null> {
    const p = await this.prisma.product.findUnique({
      where: { slug },
      select: {
        ...cardSelect,
        images: { select: { url: true, alt: true }, orderBy: { sortOrder: "asc" } },
        isActive: true,
        shortDescription: true,
        description: true,
        taxRate: true,
        ean: true,
        mpn: true,
        weightGrams: true,
        stockQuantity: true,
        containsBattery: true,
        variantGroup: true,
        metaTitle: true,
        metaDescription: true,
        updatedAt: true,
        attributes: {
          select: { key: true, label: true, value: true, unit: true, isVariantAxis: true },
          orderBy: { sortOrder: "asc" },
        },
        categories: {
          select: { isPrimary: true, category: { select: { id: true, path: true } } },
          orderBy: { sortOrder: "asc" },
        },
        relations: {
          where: { type: "ACCESSORY", to: { isActive: true } },
          select: { to: { select: cardSelect } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    if (!p || !p.isActive) return null;

    const primary = p.categories.find((c) => c.isPrimary) ?? p.categories[0];
    const tree = await this.getCategoryTree();
    const breadcrumbs: { name: string; path: string }[] = [];
    if (primary) {
      const segments = primary.category.path.split("/");
      let list = tree;
      for (let i = 0; i < segments.length; i++) {
        const path = segments.slice(0, i + 1).join("/");
        const node = list.find((n) => n.path === path);
        if (!node) break;
        breadcrumbs.push({ name: node.name, path: node.path });
        list = node.children;
      }
    }

    const variantAxes = p.attributes.filter((a) => a.isVariantAxis).map((a) => ({ key: a.key, label: a.label, unit: a.unit }));

    let variants: ProductDetail["variants"] = [];
    if (p.variantGroup) {
      const siblings = await this.prisma.product.findMany({
        where: { variantGroup: p.variantGroup, isActive: true },
        select: {
          sku: true,
          slug: true,
          stockStatus: true,
          priceGrossCents: true,
          attributes: { where: { isVariantAxis: true }, select: { key: true, value: true } },
        },
      });
      variants = siblings
        .map((s) => ({
          sku: s.sku,
          slug: s.slug,
          stockStatus: (isStockStatus(s.stockStatus) ? s.stockStatus : "IN_STOCK") as StockStatus,
          priceGrossCents: s.priceGrossCents,
          axes: Object.fromEntries(s.attributes.map((a) => [a.key, a.value])),
        }))
        .sort((a, b) => {
          for (const ax of variantAxes) {
            const c = compareValues(a.axes[ax.key] ?? "", b.axes[ax.key] ?? "");
            if (c) return c;
          }
          return 0;
        });
    }

    // "Ähnliche Artikel": gleiche Primärkategorie, andere Variantengruppe
    const related = primary
      ? await this.prisma.product.findMany({
          where: {
            isActive: true,
            id: { not: p.id },
            // NULL-sicher: "NOT variantGroup = X" würde Artikel ohne Gruppe ausschließen
            ...(p.variantGroup ? { OR: [{ variantGroup: null }, { variantGroup: { not: p.variantGroup } }] } : {}),
            categories: { some: { categoryId: primary.category.id } },
          },
          select: cardSelect,
          orderBy: [{ isBestseller: "desc" }, { name: "asc" }],
          take: 8,
        })
      : [];

    const card = toCard(p);
    return {
      ...card,
      images: p.images.length ? p.images : [FALLBACK_IMAGE],
      shortDescription: p.shortDescription,
      description: p.description,
      taxRate: p.taxRate,
      ean: p.ean,
      mpn: p.mpn,
      weightGrams: p.weightGrams,
      stockQuantity: p.stockQuantity,
      containsBattery: p.containsBattery,
      attributes: p.attributes.map(({ key, label, value, unit }) => ({ key, label, value, unit })),
      breadcrumbs,
      variantAxes,
      variants,
      accessories: p.relations.map((r) => toCard(r.to)),
      related: dedupeGroups(related).map((r) => toCard(r)),
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  // ---------------------------------------------------------------- Marken

  async getBrands(): Promise<BrandSummary[]> {
    const brands = await this.prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: {
        name: true,
        slug: true,
        featured: true,
        products: { where: { isActive: true }, select: { id: true, variantGroup: true } },
      },
    });
    return brands.map((b) => ({
      name: b.name,
      slug: b.slug,
      featured: b.featured,
      productCount: new Set(b.products.map(groupKey)).size,
    }));
  }

  async getBrand(slug: string): Promise<BrandSummary | null> {
    return (await this.getBrands()).find((b) => b.slug === slug) ?? null;
  }

  // ---------------------------------------------------------------- Autovervollständigung

  async suggest(q: string, limit = 6): Promise<SuggestResult> {
    const term = normalizeGerman(q.trim());
    if (term.length < 2) return { products: [], categories: [], brands: [] };

    const hits = await this.search.search(q, { limit: 40 });
    const rows = hits.length
      ? await this.prisma.product.findMany({
          where: { id: { in: hits.map((h) => h.id) }, isActive: true },
          select: cardSelect,
        })
      : [];
    const order = new Map(hits.map((h, i) => [h.id, i]));
    const products = dedupeGroups(rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)))
      .slice(0, limit)
      .map((r) => {
        const c = toCard(r);
        return {
          id: c.id,
          slug: c.slug,
          name: c.name,
          sku: c.sku,
          priceGrossCents: c.priceGrossCents,
          images: c.images.slice(0, 1),
          brand: c.brand,
        };
      });

    const tree = await this.getCategoryTree();
    const categories: SuggestResult["categories"] = [];
    const walk = (list: CategoryNode[], parent: CategoryNode | null) => {
      for (const n of list) {
        if (normalizeGerman(n.name).includes(term) && n.productCount > 0) {
          categories.push({ name: n.name, path: n.href.replace(/^\/shop\//, ""), parentName: parent?.name ?? null });
        }
        walk(n.children, n);
      }
    };
    walk(tree, null);

    const brands = (await this.getBrands())
      .filter((b) => b.productCount > 0 && normalizeGerman(b.name).includes(term))
      .slice(0, 4)
      .map(({ name, slug }) => ({ name, slug }));

    return { products, categories: categories.slice(0, 5), brands };
  }

  async listProductSlugs() {
    const rows = await this.prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });
    return rows.map((r) => ({ slug: r.slug, updatedAt: r.updatedAt.toISOString() }));
  }
}

/** Entfernt weitere Varianten derselben Gruppe (erste gewinnt). */
function dedupeGroups<T extends { id: string; variantGroup?: string | null }>(list: T[]): T[] {
  const seen = new Set<string>();
  return list.filter((r) => {
    const k = r.variantGroup ?? r.id;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
