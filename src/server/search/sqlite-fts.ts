/**
 * Volltextsuche mit SQLite FTS5 in einer eigenen Indexdatei (nicht in der Prisma-DB,
 * damit Prisma-Migrationen keine Drift durch virtuelle Tabellen melden).
 *
 * Zwei Indizes:
 *  - "words": unicode61-Tokenizer mit Präfixsuche ("gitterro" → Gitterrost, Gitterroste)
 *  - "tri":   Trigramm-Tokenizer für Teilwörter in Komposita ("rost" → Gitterrost)
 * Treffer aus "words" werden höher gewichtet.
 */
import Database from "better-sqlite3";
import type { SearchDocument, SearchHit, SearchProvider } from "./types";

/** Deutsche Umschrift, identisch für Index und Suchanfrage ("Wächter" ≙ "Waechter"). */
export function normalizeGerman(s: string): string {
  return s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
}

/** Zerlegt eine Nutzereingabe in sichere FTS-Tokens (keine Operatoren/Sonderzeichen durchreichen). */
export function tokenize(query: string): string[] {
  return normalizeGerman(query)
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .slice(0, 8);
}

const COLUMNS = ["id", "sku", "name", "brand", "categories", "attributes", "description", "codes"] as const;

export class SqliteFtsSearch implements SearchProvider {
  private db: Database.Database;

  constructor(filename: string) {
    this.db = new Database(filename);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS words USING fts5(
        id UNINDEXED, sku, name, brand, categories, attributes, description, codes,
        tokenize = "unicode61 remove_diacritics 2", prefix = '2 3 4'
      );
      CREATE VIRTUAL TABLE IF NOT EXISTS tri USING fts5(
        id UNINDEXED, text, tokenize = "trigram"
      );
    `);
  }

  count(): number {
    return (this.db.prepare("SELECT count(*) AS n FROM words").get() as { n: number }).n;
  }

  reindex(docs: SearchDocument[]): void {
    const insertWords = this.db.prepare(
      `INSERT INTO words (${COLUMNS.join(", ")}) VALUES (${COLUMNS.map(() => "?").join(", ")})`,
    );
    const insertTri = this.db.prepare("INSERT INTO tri (id, text) VALUES (?, ?)");
    const tx = this.db.transaction((items: SearchDocument[]) => {
      this.db.exec("DELETE FROM words; DELETE FROM tri;");
      for (const d of items) {
        const row = COLUMNS.map((c) => (c === "id" ? d.id : normalizeGerman(d[c] ?? "")));
        insertWords.run(...row);
        insertTri.run(d.id, normalizeGerman([d.name, d.brand, d.categories, d.sku].join(" ")));
      }
    });
    tx(docs);
  }

  search(query: string, { limit = 200 }: { limit?: number } = {}): SearchHit[] {
    const tokens = tokenize(query);
    if (tokens.length === 0) return [];

    const scores = new Map<string, number>();

    // 1) Wort-/Präfixsuche, BM25 mit Spaltengewichten (Name, SKU, Codes hoch)
    const wordQuery = tokens.map((t) => `"${t}"*`).join(" AND ");
    const wordRows = this.db
      .prepare(
        `SELECT id, bm25(words, 0, 8, 10, 6, 3, 2, 1, 8) AS rank
         FROM words WHERE words MATCH ? ORDER BY rank LIMIT ?`,
      )
      .all(wordQuery, limit) as { id: string; rank: number }[];
    for (const r of wordRows) scores.set(r.id, 1000 - r.rank); // bm25: kleiner = besser

    // 2) Teilwortsuche in Komposita (Trigramme brauchen ≥ 3 Zeichen; kürzere Tokens wie "xl"
    //    werden anschließend als Präfix im Wortindex geprüft)
    const longTokens = tokens.filter((t) => t.length >= 3);
    const shortTokens = tokens.filter((t) => t.length < 3);
    if (longTokens.length > 0) {
      const triQuery = longTokens.map((t) => `"${t}"`).join(" AND ");
      let triRows = this.db
        .prepare(`SELECT id, bm25(tri) AS rank FROM tri WHERE tri MATCH ? ORDER BY rank LIMIT ?`)
        .all(triQuery, limit) as { id: string; rank: number }[];
      if (shortTokens.length > 0 && triRows.length > 0) {
        const ids = triRows.map((r) => r.id);
        const ok = new Set(
          (
            this.db
              .prepare(`SELECT id FROM words WHERE words MATCH ? AND id IN (${ids.map(() => "?").join(",")})`)
              .all(shortTokens.map((t) => `"${t}"*`).join(" AND "), ...ids) as { id: string }[]
          ).map((r) => r.id),
        );
        triRows = triRows.filter((r) => ok.has(r.id));
      }
      for (const r of triRows) {
        if (!scores.has(r.id)) scores.set(r.id, 100 - r.rank);
      }
    }

    return [...scores.entries()]
      .map(([id, score]) => ({ id, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  close(): void {
    this.db.close();
  }
}
