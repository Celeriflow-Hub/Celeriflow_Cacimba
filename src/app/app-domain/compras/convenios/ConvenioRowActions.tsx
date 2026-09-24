"use client";

import Link from "next/link";
import { useState } from "react";
import { Edit, FileText, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { deleteCovenant } from "./actions";

export function ConvenioRowActions({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Excluir este convênio? Instrumentos com execução ou empenhos vinculados não podem ser excluídos.")) return;
    setIsDeleting(true);
    try {
      const result = await deleteCovenant(id);
      if (!result.success) window.alert(result.error);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex justify-end gap-1">
      <Link href={`/compras/convenios/${id}`} className={buttonVariants({ variant: "ghost", size: "icon" })} title="Ver detalhes"><FileText className="size-4 text-blue-500" /></Link>
      <Link href={`/compras/convenios/${id}/editar`} className={buttonVariants({ variant: "ghost", size: "icon" })} title="Editar"><Edit className="size-4 text-amber-500" /></Link>
      <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isDeleting} title="Excluir"><Trash2 className="size-4 text-rose-500" /></Button>
    </div>
  );
}
