/**
 * Parser für typische Exportformate. Alle liefern eine Liste flacher oder verschachtelter Rohdatensätze,
 * die danach von normalize.ts vereinheitlicht werden.
 */
import { parse as parseCsvSync } from "csv-parse/sync";
import { XMLParser } from "fast-xml-parser";
import type { RawRecord } from "./normalize";

export type ImportFormat = "csv" | "json" | "xml";

export function detectFormat(filename: string, content: string): ImportFormat {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "csv" || ext === "tsv" || ext === "txt") return "csv";
  if (ext === "json") return "json";
  if (ext === "xml") return "xml";
  const head = content.trimStart();
  if (head.startsWith("<")) return "xml";
  if (head.startsWith("{") || head.startsWith("[")) return "json";
  return "csv";
}

/** Erkennt das Trennzeichen anhand der Kopfzeile (deutsche Exporte nutzen meist ";"). */
function detectDelimiter(firstLine: string): string {
  const candidates = [";", "\t", ",", "|"];
  let best = ";";
  let bestCount = -1;
  for (const c of candidates) {
    const count = firstLine.split(c).length - 1;
    if (count > bestCount) {
      best = c;
      bestCount = count;
    }
  }
  return best;
}

export function parseCsv(content: string): RawRecord[] {
  const text = content.replace(/^﻿/, "");
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  return parseCsvSync(text, {
    columns: (header: string[]) => header.map((h) => h.trim()),
    delimiter: detectDelimiter(firstLine),
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    relax_quotes: true,
  }) as RawRecord[];
}

export function parseJson(content: string): RawRecord[] {
  const data: unknown = JSON.parse(content.replace(/^﻿/, ""));
  if (Array.isArray(data)) return data as RawRecord[];
  if (data && typeof data === "object") {
    for (const key of ["products", "produkte", "artikel", "items", "data"]) {
      const v = (data as Record<string, unknown>)[key];
      if (Array.isArray(v)) return v as RawRecord[];
    }
  }
  throw new Error("JSON-Struktur nicht erkannt: erwartet Array oder { products: [...] }");
}

const XML_RECORD_TAGS = ["product", "produkt", "artikel", "article", "item"];
const XML_LIST_TAGS = new Set([
  "category",
  "kategorie",
  "image",
  "bild",
  "attribute",
  "merkmal",
  "related",
  "sku",
  ...XML_RECORD_TAGS,
]);

/**
 * Generischer XML-Parser: sucht die erste Ebene mit wiederholten <product>/<artikel>-Knoten.
 * Unterstützt u. a.:
 *   <products><product><sku>…</sku><categories><category>…</category></categories>
 *     <attributes><attribute key="maschenweite" unit="mm">30 x 30</attribute></attributes>
 *     <images><image alt="…">/img.jpg</image></images></product></products>
 */
export function parseXml(content: string): RawRecord[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    textNodeName: "#text",
    parseTagValue: false,
    trimValues: true,
    isArray: (tagName, _jpath, isLeaf) => XML_LIST_TAGS.has(tagName.toLowerCase()) && !(isLeaf && tagName === "sku"),
  });
  const doc = parser.parse(content) as Record<string, unknown>;

  const records = findRecords(doc);
  if (!records) throw new Error(`XML-Struktur nicht erkannt: erwartet <${XML_RECORD_TAGS.join("|")}>-Knoten`);
  return records.map(flattenXmlRecord);
}

function findRecords(node: unknown, depth = 0): RawRecord[] | null {
  if (!node || typeof node !== "object" || depth > 6) return null;
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (XML_RECORD_TAGS.includes(key.toLowerCase())) {
      return (Array.isArray(value) ? value : [value]) as RawRecord[];
    }
  }
  for (const value of Object.values(node as Record<string, unknown>)) {
    const found = findRecords(value, depth + 1);
    if (found) return found;
  }
  return null;
}

/** Entpackt Container wie <categories><category/></categories> zu Arrays. */
function flattenXmlRecord(rec: RawRecord): RawRecord {
  const out: RawRecord = {};
  for (const [key, value] of Object.entries(rec)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const inner = Object.entries(value as Record<string, unknown>);
      if (inner.length === 1 && Array.isArray(inner[0][1])) {
        out[key] = (inner[0][1] as unknown[]).map(unwrapText);
        continue;
      }
    }
    if (Array.isArray(value) && key.toLowerCase() === "sku") {
      out[key] = unwrapText(value[0]);
      continue;
    }
    out[key] = unwrapText(value);
  }
  return out;
}

function unwrapText(v: unknown): unknown {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    const keys = Object.keys(o);
    if (keys.length === 1 && keys[0] === "#text") return o["#text"];
  }
  return v;
}

export function parseContent(format: ImportFormat, content: string): RawRecord[] {
  switch (format) {
    case "csv":
      return parseCsv(content);
    case "json":
      return parseJson(content);
    case "xml":
      return parseXml(content);
  }
}
