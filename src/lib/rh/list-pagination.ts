export const RH_PAGE_SIZE = 20;

export function rhPagination(rawPage: string | string[] | undefined, total: number) {
  const value = Array.isArray(rawPage) ? rawPage[0] : rawPage;
  const requested = Number(value);
  const pages = Math.max(1, Math.ceil(total / RH_PAGE_SIZE));
  const page = Math.min(pages, Number.isSafeInteger(requested) && requested > 0 ? requested : 1);
  return { page, pages, take: RH_PAGE_SIZE, skip: (page - 1) * RH_PAGE_SIZE };
}

export function rhPageHref(pathname: string, filters: Record<string, string | undefined>, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value && key !== "page") params.set(key, value);
  }
  params.set("page", String(page));
  return `${pathname}?${params.toString()}`;
}

