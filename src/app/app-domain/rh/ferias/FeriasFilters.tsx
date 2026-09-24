"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

export function FeriasFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status && status !== "all") params.set("status", status);
    
    router.push(`/rh/ferias?${params.toString()}`);
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
        <Select value={status} onValueChange={(val) => setStatus(val || "")}>
          <SelectTrigger className="bg-white">
            <span className="flex-1 text-left line-clamp-1">
              {status === "all" ? "Todos" : status}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="A vencer">A vencer</SelectItem>
            <SelectItem value="Disponível">Disponível</SelectItem>
            <SelectItem value="Programada">Programada</SelectItem>
            <SelectItem value="Em gozo">Em gozo</SelectItem>
            <SelectItem value="Concluída">Concluída</SelectItem>
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
