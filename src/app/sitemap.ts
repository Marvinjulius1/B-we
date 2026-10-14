import type { MetadataRoute } from "next";
import { getBrands, getCategoryTree, listProductSlugs, type CategoryNode } from "@/server/catalog";
import { site } from "@/config/site";

const STATIC_PATHS = ["/", "/shop", "/neu-im-sortiment", "/bestseller", "/marken"];

function flatten(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.flatMap((n) => [n, ...flatten(n.children)]);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tree, products, brands] = await Promise.all([getCategoryTree(), listProductSlugs(), getBrands()]);
  const url = (p: string) => `${site.url}${p}`;
  return [
    ...STATIC_PATHS.map((p) => ({ url: url(p), changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.7 })),
    ...flatten(tree)
      .filter((c) => c.href === `/shop/${c.path}`)
      .map((c) => ({ url: url(c.href), changeFrequency: "weekly" as const, priority: c.depth === 0 ? 0.8 : 0.6 })),
    ...products.map((p) => ({ url: url(`/produkt/${p.slug}`), lastModified: p.updatedAt, priority: 0.5 })),
    ...brands.filter((b) => b.productCount > 0).map((b) => ({ url: url(`/marken/${b.slug}`), priority: 0.4 })),
  ];
}
