"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Ban, Edit, FileText } from "lucide-react";
import Link from "next/link";
import { inactivateBidding } from "./actions";

export function LicitacaoRowActions({ id }: { id: string }) {
  const [isInactivating, setIsInactivating] = useState(false);

  async function handleInactivate() {
    if (confirm("Tem certeza que deseja inativar esta licitação?")) {
      setIsInactivating(true);
      try {
        const result = await inactivateBidding(id);
        if (!result.success) alert(result.error);
      } finally {
        setIsInactivating(false);
      }
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Link href={`/compras/licitacoes/${id}`} className={buttonVariants({ variant: "ghost", size: "icon" })} title="Ver Detalhes">
        <FileText className="h-4 w-4 text-blue-500" />
      </Link>
      <Link href={`/compras/licitacoes/${id}/editar`} className={buttonVariants({ variant: "ghost", size: "icon" })} title="Editar">
        <Edit className="h-4 w-4 text-amber-500" />
      </Link>
      <Button variant="ghost" size="icon" onClick={handleInactivate} disabled={isInactivating} title="Inativar">
        <Ban className="h-4 w-4 text-rose-500" />
      </Button>
    </div>
  );
}
