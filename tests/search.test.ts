import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeGerman, SqliteFtsSearch, tokenize } from "@/server/search/sqlite-fts";

const doc = (id: string, name: string, extra: Partial<Record<string, string>> = {}) => ({
  id,
  sku: id,
  name,
  brand: "",
  categories: "",
  attributes: "",
  description: "",
  codes: id,
  ...extra,
});

describe("Suche (SQLite FTS5)", () => {
  const s = new SqliteFtsSearch(path.join(mkdtempSync(path.join(tmpdir(), "boewe-")), "s.db"));
  s.reindex([
    doc("GR-1", "Gitterrost Normrost verzinkt"),
    doc("ST-1", "secuENTRY Türzylinder", { brand: "Burg-Wächter" }),
    doc("AS-1", "Arbeitsjacke anthrazit", { attributes: "Größe XL" }),
  ]);

  it("normalisiert Umlaute", () => {
    expect(normalizeGerman("Wächter Größe")).toBe("waechter groesse");
    expect(tokenize('"rost" OR *')).toEqual(["rost", "or"]);
  });
  it("findet Präfixe", () => expect(s.search("gitterr")[0]?.id).toBe("GR-1"));
  it("findet Teilwörter in Komposita", () => expect(s.search("rost").map((h) => h.id)).toContain("GR-1"));
  it("Umlaut-Schreibweisen sind gleichwertig", () => {
    expect(s.search("wächter")[0]?.id).toBe("ST-1");
    expect(s.search("waechter")[0]?.id).toBe("ST-1");
  });
  it("kombiniert kurze und lange Tokens", () => expect(s.search("jacke xl")[0]?.id).toBe("AS-1"));
  it("findet Artikelnummern", () => expect(s.search("ST-1")[0]?.id).toBe("ST-1"));
  it("ist robust gegen FTS-Syntax", () => expect(() => s.search('") OR NEAR(')).not.toThrow());
});
