export type EnvironmentSearchParams = { [key: string]: string | undefined };

export function filterAndPaginate<T extends object>(records: T[], searchParams: EnvironmentSearchParams) {
  const query = (searchParams.q ?? "").trim().toLocaleLowerCase("pt-BR");
  const filtered = query
    ? records.filter((record) => Object.values(record).some((value) => {
        if (value instanceof Date) return value.toLocaleDateString("pt-BR").includes(query);
        if (value && typeof value === "object") {
          return Object.values(value).some((nested) => String(nested ?? "").toLocaleLowerCase("pt-BR").includes(query));
        }
        return String(value ?? "").toLocaleLowerCase("pt-BR").includes(query);
      }))
    : records;
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const requestedPage = Number.parseInt(searchParams.page ?? "1", 10);
  const currentPage = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1), totalPages);

  return {
    currentPage,
    filtered,
    items: filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    pageSize,
    query,
    totalPages,
  };
}

export function environmentPageHref(route: string, searchParams: EnvironmentSearchParams, page: number) {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value && key !== "page") params.set(key, value);
  });
  params.set("page", String(page));
  return `${route}?${params.toString()}`;
}
