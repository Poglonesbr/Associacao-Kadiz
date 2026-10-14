import { describe, expect, it } from "vitest";
import { formatBrazilianCurrency, formatBrazilianCurrencyInput, parseBrazilianCurrency } from "@/lib/money";

describe("Brazilian currency helpers", () => {
  it("parses localized thousands and decimal separators", () => {
    expect(parseBrazilianCurrency("2.700,00")).toBe(2700);
    expect(parseBrazilianCurrency("R$ 2.700,50")).toBe(2700.5);
  });

  it("formats values for display and editable fields", () => {
    expect(formatBrazilianCurrency(2700)).toBe("R$ 2.700,00");
    expect(formatBrazilianCurrencyInput("2700.00")).toBe("2.700,00");
  });
});
