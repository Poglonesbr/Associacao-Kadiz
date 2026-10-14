"use client";

import { useState } from "react";
import { formatBrazilianCurrencyInput, parseBrazilianCurrency } from "@/lib/money";

export function CurrencyInput({
  label,
  name,
  defaultValue,
  required = false,
  className = "",
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  required?: boolean;
  className?: string;
}) {
  const [value, setValue] = useState(formatBrazilianCurrencyInput(defaultValue));

  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-sm font-medium text-neutral-300">{label}</span>
      <input
        name={name}
        type="text"
        inputMode="decimal"
        required={required}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => {
          const amount = parseBrazilianCurrency(value);
          setValue(amount === null ? value : formatBrazilianCurrencyInput(amount));
        }}
        placeholder="0,00"
        className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
      />
    </label>
  );
}
