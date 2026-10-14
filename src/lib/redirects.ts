import { readFileSync } from "node:fs";
import path from "node:path";

export interface RedirectRule {
  source: string;
  destination: string;
  statusCode: 301;
}

/**
 * Liest data/redirects.csv (Semikolon-getrennt). Wird von next.config.ts beim Build verwendet.
 * Trailing Slashes in "source" werden normalisiert, damit /alt und /alt/ greifen.
 */
export function loadRedirects(file = path.join(process.cwd(), "data/redirects.csv")): RedirectRule[] {
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return [];
  }
  const rules = new Map<string, RedirectRule>();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const [source, destination] = line.split(";").map((s) => s?.trim());
    if (!source || !destination || source === "source") continue;
    if (!source.startsWith("/") || !(destination.startsWith("/") || /^https?:\/\//.test(destination))) continue;
    const normalized = source.length > 1 ? source.replace(/\/+$/, "") : source;
    if (normalized === destination) continue;
    rules.set(normalized, { source: normalized, destination, statusCode: 301 });
  }
  return [...rules.values()];
}

interface CategoryJsonNode {
  slug: string;
  linkTo?: string;
  children?: CategoryJsonNode[];
}

/** Querverweis-Kategorien (z. B. Tore und Türen › Türschlösser) serverseitig auf die kanonische URL leiten. */
export function loadCategoryAliasRedirects(file = path.join(process.cwd(), "data/categories.json")): RedirectRule[] {
  try {
    const { categories } = JSON.parse(readFileSync(file, "utf8")) as { categories: CategoryJsonNode[] };
    const out: RedirectRule[] = [];
    const walk = (nodes: CategoryJsonNode[], prefix: string) => {
      for (const n of nodes) {
        const p = prefix ? `${prefix}/${n.slug}` : n.slug;
        if (n.linkTo) out.push({ source: `/shop/${p}`, destination: `/shop/${n.linkTo}`, statusCode: 301 });
        if (n.children) walk(n.children, p);
      }
    };
    walk(categories, "");
    return out;
  } catch {
    return [];
  }
}
