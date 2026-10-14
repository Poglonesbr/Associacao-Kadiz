const brazilianCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const brazilianDecimal = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function parseBrazilianCurrency(value: string | number | { toString(): string } | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const raw = String(value)
    .trim()
    .replace(/[^\d,.-]/g, "");
  if (!raw) return null;
  const normalized = raw.includes(",")
    ? raw.replaceAll(".", "").replace(",", ".")
    : /^\d{1,3}(\.\d{3})+$/.test(raw)
      ? raw.replaceAll(".", "")
      : raw;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

export function formatBrazilianCurrency(value: string | number | { toString(): string } | null | undefined) {
  const amount = parseBrazilianCurrency(value);
  return amount === null ? "—" : brazilianCurrency.format(amount);
}

export function formatBrazilianCurrencyInput(value: string | number | { toString(): string } | null | undefined) {
  const amount = parseBrazilianCurrency(value);
  return amount === null ? "" : brazilianDecimal.format(amount);
}
