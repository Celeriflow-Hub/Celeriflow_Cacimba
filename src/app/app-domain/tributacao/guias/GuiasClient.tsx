"use client";

import { useState } from "react";
import { Search, Receipt, DollarSign, CheckCircle2, Trash2 } from "lucide-react";
import { payGuide, cancelGuide } from "./actions";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import {
  ErpTableContainer,
  ErpTableThead,
  ErpTableTh,
  ErpTableTr,
  ErpTableTd,
  ErpStatusBadge,
  type ErpStatusVariant,
} from "@/components/app-ui/erp/ErpTable";

type Guide = {
  id: string;
  barcode: string | null;
  guideNumber?: string | null;
  totalValue: number;
  outstandingValue: number;
  dueDate: Date;
  status: string;
  assessment: {
    year: number;
    tax: { name: string };
    taxpayer: {
      person: { fullName: string; cpf: string } | null;
      company: { corporateName: string; cnpj: string } | null;
    };
  };
};

function guideVariant(status: string): ErpStatusVariant {
  if (status === "Paga") return "success";
  if (status === "Vencida") return "danger";
  if (status === "Cancelada") return "neutral";
  if (status === "Parcial") return "warning";
  return "info";
}

export default function GuiasClient({ guias }: { guias: Guide[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const filtered = guias.filter((guia) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const barcode = (guia.guideNumber || guia.barcode || "").toLowerCase();
    const taxName = guia.assessment.tax.name.toLowerCase();
    const name = (guia.assessment.taxpayer.company?.corporateName || guia.assessment.taxpayer.person?.fullName || "").toLowerCase();
    return barcode.includes(term) || taxName.includes(term) || name.includes(term);
  });
  const pageSize = 20;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handlePay = async (id: string, amount: number) => {
    if (confirm("Confirmar baixa manual desta guia?")) {
      try {
        await payGuide(id, amount);
      } catch (err) {
        console.error(err);
        alert("Erro ao realizar baixa manual.");
      }
    }
  };

  const handleCancel = async (id: string) => {
    if (confirm("Confirmar o cancelamento desta guia?")) {
      try {
        await cancelGuide(id);
      } catch (err) {
        console.error(err);
        alert("Erro ao cancelar guia.");
      }
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 p-2 sm:p-2.5 overflow-hidden">
      <ErpPageTitle
        title="Guias e Arrecadação (DAM)"
        icon={<Receipt className="size-4 text-emerald-600" />}
      />

      <ErpListFrame
        pagination={<ErpPagination page={page} total={filtered.length} pageSize={pageSize} previousHref="#" nextHref="#" label="guias" onPageChange={setPage} />}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-0 flex-1 basis-full sm:basis-auto">
              <span className="sr-only">Buscar guia</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                placeholder="Buscar por código de barras, tributo ou contribuinte"
                className="h-8 w-full rounded-md border border-slate-200 bg-white py-1 pl-8 pr-2.5 text-xs outline-none placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
          </div>
        }
      >
        <ErpTableContainer>
          <ErpTableThead>
            <tr>
              <ErpTableTh className="w-[18%]">Cód. Barras / Guia</ErpTableTh>
              <ErpTableTh className="w-[20%]">Tributo</ErpTableTh>
              <ErpTableTh className="w-[28%]">Contribuinte</ErpTableTh>
              <ErpTableTh className="w-[10%]">Vencimento</ErpTableTh>
              <ErpTableTh className="w-[12%] text-right">Valor Total</ErpTableTh>
              <ErpTableTh className="w-[6%]">Status</ErpTableTh>
              <ErpTableTh className="w-[6%] text-right">Ação</ErpTableTh>
            </tr>
          </ErpTableThead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-xs text-slate-400">
                  Nenhuma guia de arrecadação encontrada.
                </td>
              </tr>
            ) : (
              paged.map((guia) => (
                <ErpTableTr key={guia.id}>
                  <ErpTableTd className="font-mono text-[10.5px] text-slate-600 dark:text-slate-400">
                    {guia.guideNumber || guia.barcode || "—"}
                  </ErpTableTd>
                  <ErpTableTd className="font-semibold text-slate-900 dark:text-slate-100">
                    {guia.assessment.tax.name} ({guia.assessment.year})
                  </ErpTableTd>
                  <ErpTableTd>
                    {guia.assessment.taxpayer.company?.corporateName || guia.assessment.taxpayer.person?.fullName || "Não Identificado"}
                  </ErpTableTd>
                  <ErpTableTd>
                    {new Date(guia.dueDate).toLocaleDateString("pt-BR")}
                  </ErpTableTd>
                  <ErpTableTd className="text-right font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(guia.totalValue)}
                  </ErpTableTd>
                  <ErpTableTd>
                    <ErpStatusBadge variant={guideVariant(guia.status)}>{guia.status}</ErpStatusBadge>
                  </ErpTableTd>
                  <ErpTableTd className="text-right">
                    {["Emitida", "Parcial"].includes(guia.status) ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handlePay(guia.id, guia.outstandingValue)}
                          className="inline-flex h-6 items-center gap-1 rounded bg-indigo-50 px-2 text-[10.5px] font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300"
                          title="Baixa Manual"
                        >
                          <DollarSign className="size-3" />
                          Baixa
                        </button>
                        <button
                          onClick={() => handleCancel(guia.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Cancelar Guia"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ) : guia.status === "Paga" ? (
                      <span className="text-emerald-600 text-[10.5px] font-semibold flex items-center justify-end gap-1">
                        <CheckCircle2 className="size-3.5" /> Quitado
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">—</span>
                    )}
                  </ErpTableTd>
                </ErpTableTr>
              ))
            )}
          </tbody>
        </ErpTableContainer>
      </ErpListFrame>
    </div>
  );
}
