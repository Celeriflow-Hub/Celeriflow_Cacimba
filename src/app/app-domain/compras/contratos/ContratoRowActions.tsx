"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Trash, Edit, FileText } from "lucide-react";
import Link from "next/link";
import { deleteContract } from "./actions";

export function ContratoRowActions({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (confirm("Tem certeza que deseja excluir este contrato?")) {
      setIsDeleting(true);
      const result = await deleteContract(id);
      setIsDeleting(false);
      if (!result.success) alert(result.error || "Nao foi possivel excluir o contrato.");
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Link href={`/compras/contratos/${id}`} className={buttonVariants({ variant: "ghost", size: "icon" })} title="Ver Detalhes">
        <FileText className="h-4 w-4 text-blue-500" />
      </Link>
      <Link href={`/compras/contratos/${id}/editar`} className={buttonVariants({ variant: "ghost", size: "icon" })} title="Editar">
        <Edit className="h-4 w-4 text-amber-500" />
      </Link>
      <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isDeleting} title="Excluir">
        <Trash className="h-4 w-4 text-rose-500" />
      </Button>
    </div>
  );
}
