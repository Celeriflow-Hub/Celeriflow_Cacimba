export const PATRIMONIO_LIST_PAGE_SIZE = 20;

export function parsePatrimonioListPage(value: string | undefined) {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function clampPatrimonioListPage(page: number, total: number) {
  return Math.min(page, Math.max(1, Math.ceil(total / PATRIMONIO_LIST_PAGE_SIZE)));
}

export function patrimonioListHref(
  pathname: string,
  page: number,
  values: Record<string, string | undefined> = {},
) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value) search.set(key, value);
  }

  search.set("page", String(Math.max(1, page)));
  return `${pathname}?${search.toString()}`;
}
