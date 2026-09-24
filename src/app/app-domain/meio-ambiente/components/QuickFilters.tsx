"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterDef {
  name: string;
  label: string;
  options: FilterOption[];
}

export function QuickFilters({ filters }: { filters: FilterDef[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
      {filters.map((filter) => (
        <select
          key={filter.name}
          value={searchParams.get(filter.name) || ""}
          onChange={(e) => handleFilterChange(filter.name, e.target.value)}
          className="h-9 min-w-36 rounded-md border bg-white px-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">{filter.label} (Todos)</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
