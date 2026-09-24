export type MunicipalityCount = { city: string; state: string; count: number };

export function calculateMunicipalityPercentages(rows: MunicipalityCount[]) {
  const grouped = new Map<string, MunicipalityCount>();
  for (const row of rows) {
    const key = `${row.city}|${row.state}`;
    const current = grouped.get(key) || { city: row.city, state: row.state, count: 0 };
    current.count += row.count;
    grouped.set(key, current);
  }
  const total = [...grouped.values()].reduce((sum, row) => sum + row.count, 0);
  return [...grouped.values()]
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city, "pt-BR"))
    .map(row => ({ label: [row.city, row.state].filter(Boolean).join(", "), value: row.count, percentage: total ? Number(((row.count / total) * 100).toFixed(2)) : 0 }));
}
