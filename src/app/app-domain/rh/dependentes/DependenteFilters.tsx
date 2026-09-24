"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function DependenteFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [q, setQ] = useState(searchParams.get("q") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    
    router.push(`/rh/dependentes?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="mb-3 grid gap-2 rounded-md border bg-slate-50 p-2 sm:grid-cols-[minmax(12rem,1fr)_auto]">
      <div className="min-w-0">
        <Input 
          placeholder="Buscar por nome do dependente ou nome do servidor..." 
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="bg-white"
        />
      </div>
      <Button type="submit" size="sm" className="w-full sm:w-auto">
        <Search className="h-4 w-4 mr-2" />
        Filtrar
      </Button>
    </form>
  );
}
