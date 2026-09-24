"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

export function AtosFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [type, setType] = useState(searchParams.get("type") || "all");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type && type !== "all") params.set("type", type);
    
    router.push(`/rh/atos?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="mb-3 grid gap-2 rounded-md border bg-slate-50 p-2 sm:grid-cols-[minmax(12rem,1fr)_10rem_auto]">
      <div className="min-w-0">
        <Input 
          placeholder="Buscar por nome do servidor..." 
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="bg-white"
        />
      </div>
      <div className="min-w-0">
        <Select value={type} onValueChange={(val) => setType(val || "")}>
          <SelectTrigger className="bg-white">
            <span className="flex-1 text-left line-clamp-1">
              {type === "all" ? "Todos" : type}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Admissão">Admissão</SelectItem>
            <SelectItem value="Demissão">Demissão</SelectItem>
            <SelectItem value="Promoção">Promoção</SelectItem>
            <SelectItem value="Advertência">Advertência</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" size="sm" className="w-full sm:w-auto">
        <Search className="h-4 w-4 mr-2" />
        Filtrar
      </Button>
    </form>
  );
}
