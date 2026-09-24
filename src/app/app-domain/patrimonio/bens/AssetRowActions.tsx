"use client";

import Link from "next/link";
import { Pencil, Power, RotateCcw } from "lucide-react";
import { ConfirmActionDialog } from "@/components/app-ui/ConfirmActionDialog";
import { setAssetActiveAction } from "./actions";

export function AssetRowActions({ asset, canUpdate }: { asset: { id: string; name: string; status: string }; canUpdate: boolean }) {
  if (!canUpdate || asset.status === "Baixado" || asset.status === "Em manutenção") return <span className="text-[10px] text-slate-400">{asset.status === "Baixado" || asset.status === "Em manutenção" ? asset.status : "Leitura"}</span>;

  const isInactive = asset.status === "Inativo";
  return (
    <div className="flex items-center justify-end gap-0.5">
      <Link href={`/patrimonio/bens/${encodeURIComponent(asset.id)}/editar`} aria-label={`Editar ${asset.name}`} title="Editar bem" className="inline-flex size-7 items-center justify-center rounded text-slate-500 outline-none hover:bg-emerald-50 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-600">
        <Pencil className="size-3.5" />
      </Link>
      <ConfirmActionDialog
        title={isInactive ? "Reativar bem patrimonial" : "Inativar bem patrimonial"}
        description={isInactive ? `O bem “${asset.name}” voltará a ficar disponível para as operações patrimoniais.` : `O bem “${asset.name}” ficará indisponível para novas operações, sem apagar seu histórico.`}
        confirmLabel={isInactive ? "Reativar bem" : "Inativar bem"}
        action={() => setAssetActiveAction(asset.id, isInactive)}
        destructive={!isInactive}
        trigger={
          <button type="button" aria-label={`${isInactive ? "Reativar" : "Inativar"} ${asset.name}`} title={isInactive ? "Reativar bem" : "Inativar bem"} className={`inline-flex size-7 items-center justify-center rounded outline-none focus-visible:ring-2 ${isInactive ? "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:ring-emerald-600" : "text-slate-500 hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-rose-600"}`}>
            {isInactive ? <RotateCcw className="size-3.5" /> : <Power className="size-3.5" />}
          </button>
        }
      />
    </div>
  );
}
