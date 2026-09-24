"use client";

import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { deleteDependente } from "./actions";
import { useRouter } from "next/navigation";
import type { Dependent } from "@prisma/client";

export function DependenteRowActions({ dependent }: { dependent: Dependent }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm(`Deseja realmente excluir o dependente ${dependent.name}?`)) {
      const result = await deleteDependente(dependent.id);
      if (!result.success) {
        alert(result.error);
      } else {
        router.refresh();
      }
    }
  };

  return (
    <div className="flex items-center justify-end space-x-2">
      <Link href={`/rh/dependentes/${dependent.id}/editar`}>
        <Button variant="ghost" size="sm" title="Editar">
          <Edit className="h-4 w-4" />
        </Button>
      </Link>
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
