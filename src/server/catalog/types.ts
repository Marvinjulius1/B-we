/**
 * Katalog-Vertrag zwischen UI und Datenquelle.
 * Die UI arbeitet ausschließlich mit diesen DTOs – ein Wechsel auf Shopware/JTL/Medusa
 * bedeutet eine neue Implementierung von CatalogRepository, nicht neue Komponenten.
 */
import type { SortOption, StockStatus, ShippingClass } from "@/lib/catalog-constants";

export interface CategoryNode {
  id: string;
  slug: string;
  path: string;
  name: string;
  description: string | null;
  icon: string | null;
  depth: number;
  /** Ziel-URL (berücksichtigt Querverweise) */
  href: string;
  /** Anzahl aktiver Artikel inkl. Unterkategorien */
  productCount: number;
  children: CategoryNode[];
}

export interface CategoryDetail extends Omit<CategoryNode, "children"> {
  metaTitle: string | null;
  metaDescription: string | null;
  /** Wirksame Filter (eigene oder geerbte) */
  filterKeys: string[];
  ancestors: { name: string; path: string }[];
  children: CategoryNode[];
  siblings: CategoryNode[];
}

export interface BrandRef {
  name: string;
  slug: string;
}

export interface BrandSummary extends BrandRef {
  featured: boolean;
  productCount: number;
}

export interface ImageRef {
  url: string;
  alt: string;
}

export interface ProductCard {
  id: string;
  sku: string;
  slug: string;
  name: string;
  brand: BrandRef | null;
  priceGrossCents: number;
  compareAtPriceCents: number | null;
  /** Bei zusammengefassten Varianten: günstigster Preis ("ab …") */
  priceFromCents: number | null;
  variantCount: number;
  unit: string;
  stockStatus: StockStatus;
  shippingClass: ShippingClass;
  deliveryTime: string;
  images: ImageRef[];
  isNew: boolean;
  isBestseller: boolean;
  isClearance: boolean;
}

export interface ProductAttributeDTO {
  key: string;
  label: string;
  value: string;
  unit: string | null;
}

export interface VariantOption {
  sku: string;
  slug: string;
  stockStatus: StockStatus;
  priceGrossCents: number;
  /** Werte der Variantenachsen, z. B. { groesse: "L" } */
  axes: Record<string, string>;
}

export interface ProductDetail extends ProductCard {
  shortDescription: string | null;
  description: string | null;
  taxRate: number;
  ean: string | null;
  mpn: string | null;
  weightGrams: number | null;
  stockQuantity: number | null;
  containsBattery: boolean;
  attributes: ProductAttributeDTO[];
  breadcrumbs: { name: string; path: string }[];
  variantAxes: { key: string; label: string; unit: string | null }[];
  variants: VariantOption[];
  accessories: ProductCard[];
  related: ProductCard[];
  metaTitle: string | null;
  metaDescription: string | null;
  updatedAt: string;
}

export interface ProductQuery {
  categoryPath?: string;
  brandSlug?: string;
  q?: string;
  brands?: string[];
  /** Preisgrenzen in Cent */
  priceMin?: number;
  priceMax?: number;
  inStockOnly?: boolean;
  /** Attributfilter: key → erlaubte Werte (ODER innerhalb, UND zwischen Schlüsseln) */
  attributes?: Record<string, string[]>;
  flag?: "isNew" | "isBestseller" | "isClearance" | "isTopProduct";
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

export interface FacetValue {
  value: string;
  label: string;
  count: number;
  selected: boolean;
}

export interface Facet {
  key: string;
  label: string;
  unit: string | null;
  values: FacetValue[];
}

export interface ProductListResult {
  items: ProductCard[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  facets: Facet[];
  brandFacet: FacetValue[];
  inStockCount: number;
  /** Preisspanne der Grundmenge (ohne Preisfilter), Cent */
  priceRange: { min: number; max: number } | null;
}

export interface SuggestResult {
  products: Pick<ProductCard, "id" | "slug" | "name" | "sku" | "priceGrossCents" | "images" | "brand">[];
  categories: { name: string; path: string; parentName: string | null }[];
  brands: BrandRef[];
}

export interface CatalogRepository {
  getCategoryTree(): Promise<CategoryNode[]>;
  getCategory(path: string): Promise<CategoryDetail | null>;
  listProducts(query: ProductQuery): Promise<ProductListResult>;
  getProduct(slug: string): Promise<ProductDetail | null>;
  getFlaggedProducts(flag: NonNullable<ProductQuery["flag"]>, limit: number): Promise<ProductCard[]>;
  getBrands(): Promise<BrandSummary[]>;
  getBrand(slug: string): Promise<BrandSummary | null>;
  suggest(q: string, limit?: number): Promise<SuggestResult>;
  /** Für Sitemap & generateStaticParams */
  listProductSlugs(): Promise<{ slug: string; updatedAt: string }[]>;
}
