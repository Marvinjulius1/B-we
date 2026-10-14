import { describe, expect, it } from "vitest";
import { activeFilterCount, parseListingParams, toSearchString } from "@/lib/listing-params";

describe("Listen-Parameter", () => {
  it("parst Filter, Preis, Sortierung und Seite", () => {
    const p = parseListingParams(
      {
        marke: ["stihl", "abus"],
        preis: "10-99,5",
        lager: "1",
        sortierung: "preis-auf",
        seite: "3",
        maschenweite: "30 x 30",
        fremd: "x",
      },
      ["maschenweite"],
    );
    expect(p).toMatchObject({
      brands: ["stihl", "abus"],
      priceMin: 1000,
      priceMax: 9950,
      inStockOnly: true,
      sort: "preis-auf",
      page: 3,
      attributes: { maschenweite: ["30 x 30"] },
    });
    expect(activeFilterCount(p)).toBe(5);
  });

  it("ignoriert ungültige Werte", () => {
    const p = parseListingParams({ sortierung: "hack", seite: "-4" });
    expect(p.sort).toBe("relevanz");
    expect(p.page).toBe(1);
  });

  it("unterstützt das Formular ohne JavaScript", () => {
    const p = parseListingParams({ preis_min: "5", preis_max: "" });
    expect(p.priceMin).toBe(500);
    expect(p.priceMax).toBeUndefined();
  });

  it("serialisiert stabil (Round-Trip)", () => {
    const p = parseListingParams({ marke: ["b", "a"], maschenweite: "30 x 30", seite: "2" }, ["maschenweite"]);
    const s = toSearchString(p);
    expect(s).toBe("?marke=a&marke=b&maschenweite=30+x+30&seite=2");
    expect(parseListingParams(Object.fromEntries(new URLSearchParams(s).entries()), ["maschenweite"]).page).toBe(2);
  });
});
