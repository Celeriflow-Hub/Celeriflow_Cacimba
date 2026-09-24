"use client";

import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { deleteFolha } from "./actions";
import type { Payroll } from "@prisma/client";

export function FolhaRowActions({ folha }: { folha: Payroll }) {
  const handleDelete = async () => {
    if (confirm(`Deseja realmente excluir a folha de pagamento ${folha.competence}?`)) {
      const result = await deleteFolha(folha.id);
      if (!result.success) {
        alert(result.error);
      }
    }
  };

  return (
    <div className="flex items-center justify-end space-x-2">
      <Link href={`/rh/folha/${folha.id}/editar`}>
        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
          <Edit className="h-4 w-4" />
        </Button>
      </Link>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleDelete}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
