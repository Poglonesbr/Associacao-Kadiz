const supportedPageSizes = [10, 25, 50] as const;

export function getPagination(pageParam?: string, pageSizeParam?: string) {
  const parsedPage = Number(pageParam);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const parsedPageSize = Number(pageSizeParam);
  const pageSize = supportedPageSizes.includes(parsedPageSize as (typeof supportedPageSizes)[number])
    ? parsedPageSize
    : 10;

  return { page, pageSize, skip: (page - 1) * pageSize };
}
