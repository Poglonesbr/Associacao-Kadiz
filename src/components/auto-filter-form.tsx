"use client";

import type { FormHTMLAttributes, ReactNode } from "react";

export function AutoFilterForm({ children, ...props }: FormHTMLAttributes<HTMLFormElement> & { children: ReactNode }) {
  return (
    <form
      method="get"
      {...props}
      onChange={(event) => {
        if (event.target instanceof HTMLSelectElement) event.currentTarget.requestSubmit();
      }}
    >
      {children}
    </form>
  );
}
