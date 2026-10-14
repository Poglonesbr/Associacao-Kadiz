export type ParseDateOptions = { notFuture?: boolean };

export function parseBrazilianDate(value: string, options: ParseDateOptions = {}): string | null {
  const input = value.trim();
  let match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input);
  let year: number;
  let month: number;
  let day: number;

  if (match) {
    day = Number(match[1]);
    month = Number(match[2]);
    year = Number(match[3]);
  } else {
    match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
    if (!match) return null;
    year = Number(match[1]);
    month = Number(match[2]);
    day = Number(match[3]);
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;

  const isoDate = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  if (options.notFuture && isoDate > todayIso) return null;
  return isoDate;
}

export function formatBrazilianDate(value?: string | Date | null): string {
  if (!value) return "";
  if (value instanceof Date) {
    return `${String(value.getDate()).padStart(2, "0")}/${String(value.getMonth() + 1).padStart(2, "0")}/${value.getFullYear()}`;
  }
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return value;
}

export function maskBrazilianDate(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length < 3) return digits;
  if (digits.length < 5) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function maskTime(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length < 3 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function isValidTime(value: string): boolean {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}
