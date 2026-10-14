import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isValidGtin, importProductSchema } from "@/server/import/schema";
import { normalizeRecord } from "@/server/import/normalize";
import { parseCsv, parseJson, parseXml, detectFormat } from "@/server/import/parsers";
import { buildCategoryIndex, numericOf, validateRecords } from "@/server/import/importer";
import attributes from "../data/attributes.json";

const dict = attributes.attributes;
const fixture = (f: string) => readFileSync(path.join(__dirname, "../data/examples", f), "utf8");

describe("GTIN-Prüfung", () => {
  it("akzeptiert gültige EAN-13", () => expect(isValidGtin("4006381333931")).toBe(true));
  it("lehnt falsche Prüfziffer ab", () => expect(isValidGtin("4006381333932")).toBe(false));
  it("lehnt falsche Länge ab", () => expect(isValidGtin("12345")).toBe(false));
});

describe("normalizeRecord", () => {
  it("mappt deutsche Spaltennamen und Attributspalten", () => {
    const { record, unknownColumns } = normalizeRecord(
      {
        Artikelnummer: "A-1",
        Bezeichnung: "Testartikel",
        Kategorie: "Gitterroste > Normroste|Fundgrube",
        "VK Brutto": "32,50",
        Lagerstatus: "Auf Lager",
        Versandart: "Spedition",
        "attr:Maschenweite [mm]": "30 x 30",
        Gewicht: "6,5",
        Unsinn: "x",
      },
      dict,
    );
    expect(record.sku).toBe("A-1");
    expect(record.categories).toEqual(["Gitterroste > Normroste", "Fundgrube"]);
    expect(record.stockStatus).toBe("IN_STOCK");
    expect(record.shippingClass).toBe("SPEDITION");
    expect(record.weightGrams).toBe(6500);
    expect(record.attributes).toEqual([
      { key: "maschenweite", label: "Maschenweite", value: "30 x 30", unit: "mm", variantAxis: false },
    ]);
    expect(unknownColumns).toEqual(["Unsinn"]);
  });

  it("leitet Lagerstatus aus Bestand ab", () => {
    expect(normalizeRecord({ sku: "x", bestand: "0" }, dict).record.stockStatus).toBe("OUT_OF_STOCK");
    expect(normalizeRecord({ sku: "x", bestand: "3" }, dict).record.stockStatus).toBe("LOW_STOCK");
  });

  it("versteht Attribut-Objekte und Anzeigenamen", () => {
    const { record } = normalizeRecord(
      { sku: "x", attributes: { Oberfläche: "verzinkt", groesse: { value: "L", variantAxis: true } } },
      dict,
    );
    expect(record.attributes).toEqual([
      { key: "oberflaeche", label: "Oberfläche", value: "verzinkt", unit: undefined, variantAxis: false },
      { key: "groesse", label: "Größe", value: "L", unit: undefined, variantAxis: true },
    ]);
  });
});

describe("Schema", () => {
  it("setzt Standardwerte", () => {
    const p = importProductSchema.parse({ sku: "S-1", name: "Artikel", categories: ["a"], priceGross: "9,90" });
    expect(p).toMatchObject({
      taxRate: 19,
      shippingClass: "PAKET",
      stockStatus: "IN_STOCK",
      unit: "Stück",
      isActive: true,
      priceGross: 9.9,
    });
  });
  it("meldet verständliche Fehler", () => {
    const r = importProductSchema.safeParse({ sku: "", name: "A", categories: [], priceGross: "abc", taxRate: 16 });
    expect(r.success).toBe(false);
    const fields = r.error!.issues.map((i) => i.path[0]);
    expect(fields).toEqual(expect.arrayContaining(["sku", "name", "categories", "priceGross", "taxRate"]));
  });
});

describe("Parser", () => {
  it("erkennt Formate", () => {
    expect(detectFormat("a.csv", "")).toBe("csv");
    expect(detectFormat("x", "<products/>")).toBe("xml");
    expect(detectFormat("x", '{"products":[]}')).toBe("json");
  });

  it("liest Semikolon-CSV inkl. Anführungszeichen", () => {
    const rows = parseCsv(fixture("wawi-export.csv"));
    expect(rows).toHaveLength(3);
    expect(rows[0]["VK Brutto"]).toBe("44,90");
  });

  it("liest generisches XML", () => {
    const [row] = parseXml(fixture("shop-export.xml"));
    expect(row.sku).toBe("DEMO-XML-1");
    expect(row.categories).toEqual(["Eisenwaren > Pfostenträger und -kappen"]);
    const { record } = normalizeRecord(row, dict);
    expect(record.attributes).toHaveLength(2);
    expect(record.images).toEqual([
      { url: "/images/placeholder/hardware-1.svg", alt: "Pfostenträger U-Form", source: undefined, rights: undefined },
    ]);
  });

  it("liest JSON-Hüllen", () => {
    expect(parseJson('{"produkte":[{"sku":"a"}]}')).toEqual([{ sku: "a" }]);
  });
});

describe("validateRecords", () => {
  it("trennt gültige und fehlerhafte Datensätze mit Zeilennummern", () => {
    const { valid, issues } = validateRecords(parseCsv(fixture("wawi-export.csv")), dict);
    expect(valid.map((v) => v.product.sku)).toEqual(["DEMO-CSV-1", "DEMO-CSV-2"]);
    const errors = issues.filter((i) => i.level === "error");
    expect(errors.every((e) => e.row === 3)).toBe(true);
    expect(errors.map((e) => e.field)).toEqual(expect.arrayContaining(["categories", "ean"]));
  });

  it("erkennt doppelte SKUs", () => {
    const base = { name: "Artikel", categories: ["a"], priceGross: 1 };
    const { valid, issues } = validateRecords(
      [
        { sku: "D", ...base },
        { sku: "D", ...base },
      ],
      dict,
    );
    expect(valid).toHaveLength(1);
    expect(issues[0].message).toMatch(/Doppelte SKU/);
  });

  it("validiert die Seed-Daten vollständig", () => {
    const { products } = JSON.parse(readFileSync(path.join(__dirname, "../data/seed-products.json"), "utf8"));
    const { valid, issues } = validateRecords(products, dict);
    expect(issues.filter((i) => i.level === "error")).toEqual([]);
    expect(valid.length).toBeGreaterThanOrEqual(40);
    expect(valid.length).toBeLessThanOrEqual(60);
  });
});

describe("Kategorieauflösung", () => {
  const idx = buildCategoryIndex([
    { id: "1", path: "gitterroste", name: "Gitterroste", parentId: null, linkToPath: null },
    { id: "2", path: "gitterroste/zubehoer", name: "Gitterrost-Zubehör", parentId: "1", linkToPath: null },
    { id: "3", path: "sicherheitstechnik", name: "Sicherheitstechnik", parentId: null, linkToPath: null },
    { id: "4", path: "sicherheitstechnik/tuerschloesser", name: "Türschlösser", parentId: "3", linkToPath: null },
    { id: "5", path: "tore-und-tueren", name: "Tore und Türen", parentId: null, linkToPath: null },
    {
      id: "6",
      path: "tore-und-tueren/tuerschloesser",
      name: "Türschlösser",
      parentId: "5",
      linkToPath: "sicherheitstechnik/tuerschloesser",
    },
  ]);
  it("per Slug-Pfad", () => expect(idx.resolve("gitterroste/zubehoer")?.id).toBe("2"));
  it("per Namenspfad", () => expect(idx.resolve("Gitterroste > Gitterrost-Zubehör")?.id).toBe("2"));
  it("folgt Querverweisen", () => expect(idx.resolve("Tore und Türen > Türschlösser")?.id).toBe("4"));
  it("mehrdeutige Blattnamen werden nicht geraten", () => expect(idx.resolve("Türschlösser")).toBeNull());
});

describe("numericOf", () => {
  it.each([
    ["30 x 30", 30],
    ["1.000 mm", 1000],
    ["12,5", 12.5],
    ["anthrazit", null],
  ])("%s → %s", (v, n) => expect(numericOf(v)).toBe(n));
});
