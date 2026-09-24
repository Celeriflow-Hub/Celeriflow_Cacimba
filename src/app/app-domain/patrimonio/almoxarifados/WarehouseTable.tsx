"use client";

import Link from "next/link";
import { useState } from "react";
import { MapPin, Pencil, Power, RotateCcw, Trash2 } from "lucide-react";
import { ConfirmActionDialog } from "@/components/app-ui/ConfirmActionDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteWarehouseAction, setWarehouseActiveAction } from "./actions";

type WarehouseRow = {
  id: string;
  name: string;
  type: string;
  address: string | null;
  zipCode: string | null;
  streetName: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  isActive: boolean;
  managerName: string | null;
  costCenterName: string | null;
};

export function WarehouseTable({ warehouses, canUpdate, canDelete }: { warehouses: WarehouseRow[]; canUpdate: boolean; canDelete: boolean }) {
  const [addressWarehouse, setAddressWarehouse] = useState<WarehouseRow | null>(null);

  return (
    <>
      <table className="w-full table-fixed text-left text-[11px] leading-4 text-slate-700">
        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          <tr className="h-7">
            <th className="w-[28%] px-3 text-left">Nome</th>
            <th className="w-[11%] px-3 text-left">Tipo</th>
            <th className="w-[8%] px-2 text-center">Endereço</th>
            <th className="w-[22%] px-3 text-left">Responsável</th>
            <th className="hidden w-[17%] px-3 text-left xl:table-cell">Centro de custo</th>
            <th className="w-[10%] px-3 text-left">Situação</th>
            <th className="w-[4.5rem] px-2 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {warehouses.length === 0 ? (
            <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-500">Nenhum almoxarifado encontrado.</td></tr>
          ) : (
            warehouses.map((warehouse) => {
              const inactive = !warehouse.isActive;
              return (
                <tr key={warehouse.id} className="h-[clamp(28px,3.2vh,38px)] border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-0 font-semibold text-emerald-800"><span className="block truncate">{warehouse.name}</span></td>
                  <td className="px-3 py-0"><span className="block truncate">{warehouse.type}</span></td>
                  <td className="px-2 py-0 text-center"><button type="button" aria-label={`Ver endereço de ${warehouse.name}`} title="Ver endereço" onClick={() => setAddressWarehouse(warehouse)} className="inline-flex size-7 items-center justify-center rounded text-slate-500 outline-none hover:bg-emerald-50 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-600"><MapPin className="size-3.5" /></button></td>
                  <td className="px-3 py-0 text-slate-600"><span className="block truncate">{warehouse.managerName || "Sem responsável definido"}</span></td>
                  <td className="hidden px-3 py-0 xl:table-cell"><span className="block truncate">{warehouse.costCenterName || "Não vinculado"}</span></td>
                  <td className="px-3 py-0"><span className={`font-semibold ${inactive ? "text-rose-700" : "text-emerald-700"}`}>{inactive ? "Inativo" : "Ativo"}</span></td>
                  <td className="px-2 py-0">
                    {(canUpdate || canDelete) ? (
                      <div className="flex items-center justify-end gap-0.5">
                        {canUpdate && <Link href={`/patrimonio/almoxarifados/${encodeURIComponent(warehouse.id)}/editar`} aria-label={`Editar ${warehouse.name}`} title="Editar almoxarifado" className="inline-flex size-7 items-center justify-center rounded text-slate-500 outline-none hover:bg-emerald-50 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-600"><Pencil className="size-3.5" /></Link>}
                        {canUpdate && <ConfirmActionDialog title={inactive ? "Reativar almoxarifado" : "Inativar almoxarifado"} description={inactive ? `O almoxarifado “${warehouse.name}” voltará a ficar disponível para movimentações.` : `O almoxarifado “${warehouse.name}” deixará de aceitar novas movimentações. Seu histórico será preservado.`} confirmLabel={inactive ? "Reativar" : "Inativar"} action={() => setWarehouseActiveAction(warehouse.id, inactive)} destructive={!inactive} trigger={<button type="button" aria-label={`${inactive ? "Reativar" : "Inativar"} ${warehouse.name}`} title={inactive ? "Reativar almoxarifado" : "Inativar almoxarifado"} className={`inline-flex size-7 items-center justify-center rounded outline-none focus-visible:ring-2 ${inactive ? "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:ring-emerald-600" : "text-slate-500 hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-rose-600"}`}>{inactive ? <RotateCcw className="size-3.5" /> : <Power className="size-3.5" />}</button>} />}
                        {canDelete && <ConfirmActionDialog title="Excluir almoxarifado" description={`A exclusão de “${warehouse.name}” é permanente e só será concluída se não houver estoque, movimentações ou outros registros vinculados.`} confirmLabel="Excluir definitivamente" action={() => deleteWarehouseAction(warehouse.id)} destructive trigger={<button type="button" aria-label={`Excluir ${warehouse.name}`} title="Excluir almoxarifado" className="inline-flex size-7 items-center justify-center rounded text-slate-500 outline-none hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-2 focus-visible:ring-rose-600"><Trash2 className="size-3.5" /></button>} />}
                      </div>
                    ) : <span className="text-[10px] text-slate-400">Leitura</span>}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <Dialog open={Boolean(addressWarehouse)} onOpenChange={(open) => { if (!open) setAddressWarehouse(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Endereço do almoxarifado</DialogTitle>
            <DialogDescription>{addressWarehouse?.name}</DialogDescription>
          </DialogHeader>
          {addressWarehouse && <dl className="grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-xs text-slate-500">CEP</dt><dd>{addressWarehouse.zipCode || "Não informado"}</dd></div><div><dt className="text-xs text-slate-500">UF</dt><dd>{addressWarehouse.state || "Não informada"}</dd></div><div className="sm:col-span-2"><dt className="text-xs text-slate-500">Rua e número</dt><dd>{[addressWarehouse.streetName, addressWarehouse.number].filter(Boolean).join(", ") || addressWarehouse.address || "Não informado"}</dd></div><div><dt className="text-xs text-slate-500">Bairro</dt><dd>{addressWarehouse.neighborhood || "Não informado"}</dd></div><div><dt className="text-xs text-slate-500">Cidade</dt><dd>{addressWarehouse.city || "Não informada"}</dd></div></dl>}
        </DialogContent>
      </Dialog>
    </>
  );
}
