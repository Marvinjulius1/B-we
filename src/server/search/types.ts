/**
 * Such-Abstraktion. Die Shop-Oberfläche kennt nur dieses Interface.
 * Implementierungen: SQLite FTS5 (Entwicklung, sqlite-fts.ts). Später z. B. PostgreSQL-Volltext oder Meilisearch.
 */
export interface SearchDocument {
  id: string;
  sku: string;
  name: string;
  brand: string;
  categories: string;
  attributes: string;
  description: string;
  /** EAN, Herstellernummer usw. – exakte Treffer werden hoch gewichtet */
  codes: string;
}

export interface SearchHit {
  id: string;
  /** Höher = relevanter */
  score: number;
}

export interface SearchProvider {
  /** Liefert nach Relevanz sortierte Produkt-IDs. */
  search(query: string, options?: { limit?: number }): SearchHit[] | Promise<SearchHit[]>;
  /** Ersetzt den kompletten Index. */
  reindex(docs: SearchDocument[]): void | Promise<void>;
  /** Anzahl indizierter Dokumente (für Health-Checks/Lazy-Reindex). */
  count(): number | Promise<number>;
}
