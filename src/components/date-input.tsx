"use client";

import { useState } from "react";
import { formatBrazilianDate, isValidTime, maskBrazilianDate, maskTime, parseBrazilianDate } from "@/lib/dates";

const inputClassName =
  "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none";

export function DateInput({
  label,
  name,
  defaultValue,
  required = false,
  className = "",
  notFuture,
}: {
  label: string;
  name: string;
  defaultValue?: string | Date | null;
  required?: boolean;
  className?: string;
  notFuture?: boolean;
}) {
  const [value, setValue] = useState(formatBrazilianDate(defaultValue));
  const rejectFuture = notFuture ?? name === "birthDate";

  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-sm font-medium text-neutral-300">{label}</span>
      <input
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd/mm/aaaa"
        required={required}
        pattern="\d{2}/\d{2}/\d{4}"
        value={value}
        onChange={(event) => {
          setValue(maskBrazilianDate(event.target.value));
          event.target.setCustomValidity("");
        }}
        onBlur={(event) => {
          if (!event.target.value && !required) return;
          event.target.setCustomValidity(
            parseBrazilianDate(event.target.value, { notFuture: rejectFuture })
              ? ""
              : rejectFuture
                ? "Informe uma data válida e não futura no formato dd/mm/aaaa."
                : "Informe uma data válida no formato dd/mm/aaaa.",
          );
        }}
        className={inputClassName}
      />
    </label>
  );
}

export function TimeInput({
  label,
  name,
  defaultValue = "",
  required = false,
  className = "",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-sm font-medium text-neutral-300">{label}</span>
      <input
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="HH:mm"
        required={required}
        pattern="(?:[01]\d|2[0-3]):[0-5]\d"
        value={value}
        onChange={(event) => {
          setValue(maskTime(event.target.value));
          event.target.setCustomValidity("");
        }}
        onBlur={(event) => {
          if (!event.target.value && !required) return;
          event.target.setCustomValidity(
            isValidTime(event.target.value) ? "" : "Informe um horário válido no formato HH:mm.",
          );
        }}
        className={inputClassName}
      />
    </label>
  );
}
