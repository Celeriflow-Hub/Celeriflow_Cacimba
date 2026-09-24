"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ErpStatusBadge, ErpTableContainer, ErpTableTd, ErpTableTh, ErpTableThead, ErpTableTr } from "@/components/app-ui/erp/ErpTable";

export type ImportBatchRow = {
  id: string;
  source: string;
  competence: string;
  origin: string;
  fileName: string;
  fileFormat: string;
  contractVersion: string;
  status: string;
  processedCount: number;
  insertedCount: number;
  updatedCount: number;
  ignoredCount: number;
  issueCount: number;
  startedAt: string;
  completedAt: string | null;
  actorName: string;
  issues: { id: string; rowNumber: number; entityType: string; reason: string }[];
};

function statusLabel(status: string) {
  if (status === "COMPLETED") return "Concluída";
  if (status === "COMPLETED_WITH_ISSUES") return "Com inconsistências";
  if (status === "FAILED") return "Falhou";
  return "Em processamento";
}

export function ImportHistory({ rows }: { rows: ImportBatchRow[] }) {
  const [detail, setDetail] = useState<ImportBatchRow | null>(null);
  return (
    <>
      <section className="flex min-h-[220px] shrink-0 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm lg:min-h-0 lg:flex-1">
        <div className="shrink-0 border-b border-slate-200 px-3 py-2">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-700">Histórico de cargas</h2>
        </div>
        <ErpTableContainer className="min-h-[220px] overflow-y-auto overflow-x-hidden">
          <ErpTableThead><ErpTableTr>
            <ErpTableTh className="w-[15%]">Origem</ErpTableTh><ErpTableTh className="w-[12%]">Competência</ErpTableTh><ErpTableTh className="w-[18%]">Data</ErpTableTh>
            <ErpTableTh className="hidden w-[12%] text-right md:table-cell">Registros</ErpTableTh><ErpTableTh>Situação</ErpTableTh><ErpTableTh className="w-[80px] text-center">Ações</ErpTableTh>
          </ErpTableTr></ErpTableThead>
          <tbody>
            {rows.map(row => <ErpTableTr key={row.id}>
              <ErpTableTd>{row.source}</ErpTableTd><ErpTableTd>{row.competence}</ErpTableTd><ErpTableTd>{new Date(row.startedAt).toLocaleString("pt-BR")}</ErpTableTd>
              <ErpTableTd className="hidden text-right tabular-nums md:table-cell">{row.processedCount}</ErpTableTd>
              <ErpTableTd><ErpStatusBadge variant={row.status === "COMPLETED" ? "success" : row.status === "FAILED" ? "danger" : row.status === "PROCESSING" ? "info" : "warning"}>{statusLabel(row.status)}</ErpStatusBadge></ErpTableTd>
              <ErpTableTd className="text-center"><button type="button" onClick={() => setDetail(row)} aria-label={`Detalhar carga ${row.source} ${row.competence}`} className="inline-flex size-7 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50"><Eye className="size-3.5" /></button></ErpTableTd>
            </ErpTableTr>)}
            {!rows.length && <ErpTableTr><ErpTableTd colSpan={6} className="py-8 text-center text-slate-500">Nenhuma carga registrada.</ErpTableTd></ErpTableTr>}
          </tbody>
        </ErpTableContainer>
      </section>
      <Dialog open={Boolean(detail)} onOpenChange={open => !open && setDetail(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[760px]">
          <DialogHeader><DialogTitle>Detalhes da carga</DialogTitle><DialogDescription>{detail?.source} · competência {detail?.competence} · {detail?.fileName}</DialogDescription></DialogHeader>
          {detail && <div className="space-y-4 text-sm">
            <dl className="grid gap-3 rounded border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
              {[['Situação', statusLabel(detail.status)], ['Origem', detail.origin], ['Formato', detail.fileFormat], ['Processados', String(detail.processedCount)], ['Incluídos', String(detail.insertedCount)], ['Atualizados', String(detail.updatedCount)], ['Ignorados', String(detail.ignoredCount)], ['Inconsistências', String(detail.issueCount)], ['Operador', detail.actorName]].map(([label, value]) => <div key={label}><dt className="text-[11px] font-semibold text-slate-500">{label}</dt><dd className="break-words font-medium text-slate-800">{value}</dd></div>)}
            </dl>
            <div><h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700">Inconsistências</h3>
              <div className="max-h-64 overflow-y-auto rounded border border-slate-200">
                {detail.issues.map(item => <div key={item.id} className="grid grid-cols-[70px_110px_1fr] gap-2 border-b border-slate-100 px-3 py-2 text-xs last:border-b-0"><span>Linha {item.rowNumber}</span><strong>{item.entityType}</strong><span className="break-words">{item.reason}</span></div>)}
                {!detail.issues.length && <p className="p-3 text-xs text-slate-500">Nenhuma inconsistência registrada.</p>}
                {detail.issueCount > detail.issues.length && <p className="border-t p-3 text-xs text-slate-500">Exibindo as primeiras {detail.issues.length} inconsistências.</p>}
              </div>
            </div>
          </div>}
          <DialogFooter><Button type="button" variant="outline" onClick={() => setDetail(null)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
