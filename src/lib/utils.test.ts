import { describe, expect, it } from "vitest";

import { formatCurrency, formatPercent, safeId } from "@/lib/utils";

describe("utils formatting", () => {
  it("formats euro values in de-DE locale", () => {
    expect(formatCurrency(1200)).toBe("1.200,00 €");
  });

  it("formats percent values", () => {
    expect(formatPercent(0.845)).toBe("84,5 %");
  });
});

describe("safeId", () => {
  it("transforms strings into kebab case identifiers", () => {
    expect(safeId("Ärztliche Dokumentation 2025!")).toBe("arztliche-dokumentation-2025");
  });
});
