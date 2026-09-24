"use client";

import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { deleteFerias } from "./actions";
import type { Vacation } from "@prisma/client";

export function FeriasRowActions({ vacation }: { vacation: Vacation }) {
  const handleDelete = async () => {
    if (confirm(`Deseja realmente excluir o registro de férias deste servidor?`)) {
      const result = await deleteFerias(vacation.id);
      if (!result.success) {
        alert(result.error);
      }
    }
  };

  return (
    <div className="flex items-center justify-end space-x-2">
      <Link href={`/rh/ferias/${vacation.id}/editar`}>
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
