"use client";

import { Edit, PowerOff, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toggleBeneficioStatus, deleteBeneficio } from "./actions";
import { useRouter } from "next/navigation";
import type { BenefitConfig } from "@prisma/client";

export function BeneficioRowActions({ beneficio }: { beneficio: BenefitConfig }) {
  const router = useRouter();

  const handleToggleStatus = async () => {
    if (confirm(`Tem certeza que deseja ${beneficio.isActive ? 'inativar' : 'ativar'} o benefício ${beneficio.name}?`)) {
      const result = await toggleBeneficioStatus(beneficio.id, !beneficio.isActive);
      if (!result.success) {
        alert(result.error);
      } else {
        router.refresh();
      }
    }
  };

  const handleDelete = async () => {
    if (confirm(`Deseja realmente excluir o benefício ${beneficio.name} do sistema? (Apenas permitido se não estiver sendo usado por servidores)`)) {
      const result = await deleteBeneficio(beneficio.id);
      if (!result.success) {
        alert(result.error);
      } else {
        router.refresh();
      }
    }
  };

  return (
    <div className="flex items-center justify-end space-x-2">
      <Link href={`/rh/beneficios/${beneficio.id}/editar`}>
        <Button variant="ghost" size="sm" title="Editar">
          <Edit className="h-4 w-4" />
        </Button>
      </Link>
      <Button 
        variant="ghost" 
        size="sm" 
        title={beneficio.isActive ? "Inativar" : "Ativar"}
        onClick={handleToggleStatus}
      >
        {beneficio.isActive ? (
          <PowerOff className="h-4 w-4 text-orange-500" />
        ) : (
          <Power className="h-4 w-4 text-emerald-500" />
        )}
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        title="Excluir"
        onClick={handleDelete}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
