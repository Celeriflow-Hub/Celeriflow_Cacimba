"use client";

import { Edit, PowerOff, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toggleServidorStatus } from "./actions";
import type { Employee } from "@prisma/client";

export function ServidorRowActions({ employee }: { employee: Employee }) {
  const handleToggleStatus = async () => {
    if (confirm(`Tem certeza que deseja ${employee.isActive ? 'inativar' : 'ativar'} o servidor ${employee.name}?`)) {
      const result = await toggleServidorStatus(employee.id, !employee.isActive);
      if (!result.success) {
        alert(result.error);
      }
    }
  };

  return (
    <div className="flex items-center justify-end space-x-2">
      <Link href={`/rh/servidores/${employee.id}/editar`}>
        <Button variant="ghost" size="sm" title="Editar">
          <Edit className="h-4 w-4" />
        </Button>
      </Link>
      <Button 
        variant="ghost" 
        size="sm" 
        title={employee.isActive ? "Inativar" : "Ativar"}
        onClick={handleToggleStatus}
      >
        {employee.isActive ? (
          <PowerOff className="h-4 w-4 text-orange-500" />
        ) : (
          <Power className="h-4 w-4 text-emerald-500" />
        )}
      </Button>
    </div>
  );
}
