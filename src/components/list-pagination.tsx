"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const pageSizes = [10, 25, 50];

export function ListPagination({ total, page, pageSize }: { total: number; page: number; pageSize: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  function navigate(nextPage: number, nextPageSize = pageSize) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage === 1) params.delete("page");
    else params.set("page", String(nextPage));
    params.set("pageSize", String(nextPageSize));
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex items-center gap-4">
      <label className="flex items-center gap-2 whitespace-nowrap">
        <span>Por página</span>
        <select
          aria-label="Itens por página"
          className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-white"
          value={pageSize}
          onChange={(event) => navigate(1, Number(event.target.value))}
        >
          {pageSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => navigate(page - 1)}
        className="disabled:cursor-not-allowed disabled:text-neutral-600"
      >
        Anterior
      </button>
      <span className="rounded bg-neutral-800 px-2 py-1 text-white">
        {page} / {pageCount}
      </span>
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={() => navigate(page + 1)}
        className="disabled:cursor-not-allowed disabled:text-neutral-600"
      >
        Próximo
      </button>
    </div>
  );
}
