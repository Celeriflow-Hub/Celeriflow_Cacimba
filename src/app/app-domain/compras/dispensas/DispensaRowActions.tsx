"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Trash, Edit, FileText } from "lucide-react";
import Link from "next/link";
import { deleteDispensa } from "./actions";

export function DispensaRowActions({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (confirm("Tem certeza que deseja excluir esta dispensa?")) {
      setIsDeleting(true);
      await deleteDispensa(id);
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Link href={`/compras/dispensas/${id}`} className={buttonVariants({ variant: "ghost", size: "icon" })} title="Ver Detalhes">
        <FileText className="h-4 w-4 text-blue-500" />
      </Link>
      <Link href={`/compras/dispensas/${id}/editar`} className={buttonVariants({ variant: "ghost", size: "icon" })} title="Editar">
        <Edit className="h-4 w-4 text-amber-500" />
      </Link>
      <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isDeleting} title="Excluir">
        <Trash className="h-4 w-4 text-rose-500" />
      </Button>
    </div>
  );
}
