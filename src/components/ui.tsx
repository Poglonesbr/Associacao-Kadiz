import Link from "next/link";
import type { ReactNode } from "react";
import { ListPagination } from "@/components/list-pagination";
import { DateInput, TimeInput } from "@/components/date-input";
import { CurrencyInput } from "@/components/currency-input";
import { labelFor } from "@/lib/labels";

export function PageHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-emerald-400">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
      </div>
      {action}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-neutral-800 bg-neutral-900 ${className}`}>{children}</section>;
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "green" | "amber" | "red" | "blue" | "neutral";
}) {
  const tones = {
    green: "bg-emerald-950 text-emerald-300",
    amber: "bg-amber-950 text-amber-300",
    red: "bg-red-950 text-red-300",
    blue: "bg-blue-950 text-blue-300",
    neutral: "bg-neutral-800 text-neutral-300",
  };
  const label = typeof children === "string" ? labelFor(children) : children;
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${tones[tone]}`}>{label}</span>;
}

export function DataTable({
  headers,
  children,
  count,
  start = 1,
  pageSize = 10,
  page,
  footer = true,
}: {
  headers: string[];
  children: ReactNode;
  count: number;
  start?: number;
  pageSize?: number;
  page?: number;
  footer?: boolean;
}) {
  const currentPage = page ?? 1;
  const currentStart = page ? (count ? (page - 1) * pageSize + 1 : 0) : start;
  const end = Math.min(currentPage * pageSize, count);

  return (
    <Panel className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-neutral-800 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              {headers.map((header) => (
                <th className="px-4 py-3 font-medium" key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">{children}</tbody>
        </table>
      </div>
      {footer && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800 px-4 py-3 text-xs text-neutral-400">
          <span>
            Exibindo {count ? currentStart : 0} a {end} de {count}
          </span>
          {page ? <ListPagination total={count} page={page} pageSize={pageSize} /> : <span>{count ? "1" : "0"}</span>}
        </div>
      )}
    </Panel>
  );
}

export function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
  placeholder,
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  placeholder?: string;
  className?: string;
}) {
  if (type === "date") {
    return (
      <DateInput
        label={label}
        name={name}
        required={required}
        defaultValue={defaultValue ? String(defaultValue) : ""}
        className={className}
      />
    );
  }
  if (type === "time") {
    return (
      <TimeInput
        label={label}
        name={name}
        required={required}
        defaultValue={defaultValue ? String(defaultValue) : ""}
        className={className}
      />
    );
  }
  if (type === "currency") {
    return (
      <CurrencyInput label={label} name={name} defaultValue={defaultValue} required={required} className={className} />
    );
  }
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-sm font-medium text-neutral-300">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
      />
    </label>
  );
}

export function SelectField({
  label,
  name,
  options,
  required = false,
  defaultValue,
}: {
  label: string;
  name: string;
  options: [string, string][];
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-neutral-300">{label}</span>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
      >
        {options.map(([value, labelText]) => (
          <option key={value} value={value}>
            {labelText}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MultiSelectField({
  label,
  name,
  options,
  defaultValue = [],
}: {
  label: string;
  name: string;
  options: [string, string][];
  defaultValue?: string[];
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-neutral-300">{label}</span>
      <select
        name={name}
        multiple
        defaultValue={defaultValue}
        className="min-h-24 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
      >
        {options.map(([value, labelText]) => (
          <option key={value} value={value}>
            {labelText}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Button({
  children,
  variant = "primary",
  type = "submit",
  className = "",
  disabled = false,
  onClick,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const styles = {
    primary: "bg-emerald-500 text-black hover:bg-emerald-400",
    secondary: "border border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700",
    danger: "bg-red-950 text-red-300 hover:bg-red-900",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <div className="px-4 py-12 text-center text-sm text-neutral-500">{text}</div>;
}

export function LinkButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
}) {
  const styles = {
    primary: "bg-emerald-500 text-black hover:bg-emerald-400",
    secondary: "border border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700",
    danger: "bg-red-950 text-red-300 hover:bg-red-900",
  };
  return (
    <Link className={`inline-flex rounded-lg px-3.5 py-2 text-sm font-semibold ${styles[variant]}`} href={href}>
      {children}
    </Link>
  );
}
