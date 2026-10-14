import { describe, expect, it } from "vitest";
import { formatPrice, netFromGross, parseDecimal, toCents } from "@/lib/money";

describe("parseDecimal", () => {
  it.each([
    ["32,50", 32.5],
    ["1.299,00", 1299],
    ["1,299.00", 1299],
    ["32.50", 32.5],
    ["32,50 €", 32.5],
    ["1.299", 1299],
    [32.5, 32.5],
    ["EUR 9,90", 9.9],
  ])("%s → %s", (input, expected) => {
    expect(parseDecimal(input)).toBe(expected);
  });

  it("lehnt Unsinn ab", () => {
    expect(parseDecimal("abc")).toBeNull();
    expect(parseDecimal("")).toBeNull();
    expect(parseDecimal(undefined)).toBeNull();
  });
});

describe("Preise", () => {
  it("rundet kaufmännisch in Cent", () => {
    expect(toCents(32.5)).toBe(3250);
    expect(toCents(0.1 + 0.2)).toBe(30);
  });
  it("formatiert deutsch", () => {
    expect(formatPrice(3250).replace(/\s/g, " ")).toBe("32,50 €");
  });
  it("rechnet netto aus brutto", () => {
    expect(netFromGross(11900, 19)).toBe(10000);
  });
});
