"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ErpStatusBadge, ErpTableContainer, ErpTableTd, ErpTableTh, ErpTableThead, ErpTableTr } from "@/components/app-ui/erp/ErpTable";

export type ProcedureRow = {
  id: string;
  source: string;
  competence: string;
  code: string;
  description: string;
  group: string;
  subgroup: string;
  complexity: string;
  registrationInstrument: string;
  unitValue: string | null;
  minimumAge: number | null;
  maximumAge: number | null;
  allowedSex: string;
  financing: string;
  cidCodes: string;
  cboCodes: string;
  serviceCodes: string;
  classificationCodes: string;
  isActive: boolean;
  origin: string;
  fileName: string;
  versions: { id: string; competence: string; isCurrent: boolean; createdAt: string; origin: string; fileName: string }[];
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function ProcedureCatalog({ rows }: { rows: ProcedureRow[] }) {
  const [detail, setDetail] = useState<ProcedureRow | null>(null);
  return (
    <>
      <ErpTableContainer className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-md border border-slate-200 shadow-sm">
        <ErpTableThead><ErpTableTr>
          <ErpTableTh className="w-[15%]">Código</ErpTableTh><ErpTableTh>Descrição</ErpTableTh><ErpTableTh className="hidden w-[16%] md:table-cell">Grupo</ErpTableTh>
          <ErpTableTh className="hidden w-[13%] lg:table-cell">Complexidade</ErpTableTh><ErpTableTh className="w-[13%]">Competência</ErpTableTh><ErpTableTh className="w-[11%]">Situação</ErpTableTh><ErpTableTh className="w-[70px] text-center">Ações</ErpTableTh>
        </ErpTableTr></ErpTableThead>
        <tbody>
          {rows.map(row => <ErpTableTr key={row.id}>
            <ErpTableTd className="font-mono">{row.code}</ErpTableTd><ErpTableTd>{row.description}</ErpTableTd><ErpTableTd className="hidden md:table-cell">{row.group || "-"}</ErpTableTd>
            <ErpTableTd className="hidden lg:table-cell">{row.complexity || "-"}</ErpTableTd><ErpTableTd>{row.competence}</ErpTableTd>
            <ErpTableTd><ErpStatusBadge variant={row.isActive ? "success" : "neutral"}>{row.isActive ? "Ativo" : "Inativo"}</ErpStatusBadge></ErpTableTd>
            <ErpTableTd className="text-center"><button type="button" onClick={() => setDetail(row)} aria-label={`Detalhar procedimento ${row.code}`} className="inline-flex size-7 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50"><Eye className="size-3.5" /></button></ErpTableTd>
          </ErpTableTr>)}
          {!rows.length && <ErpTableTr><ErpTableTd colSpan={7} className="py-8 text-center text-slate-500">Nenhum procedimento encontrado.</ErpTableTd></ErpTableTr>}
        </tbody>
      </ErpTableContainer>
      <Dialog open={Boolean(detail)} onOpenChange={open => !open && setDetail(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[760px]">
          <DialogHeader><DialogTitle>{detail?.code} · {detail?.description}</DialogTitle><DialogDescription>{detail?.source} · competência {detail?.competence}</DialogDescription></DialogHeader>
          {detail && <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {[
              ["Grupo", detail.group], ["Subgrupo", detail.subgroup], ["Complexidade", detail.complexity], ["Instrumento de registro", detail.registrationInstrument],
              ["Valor unitário", detail.unitValue === null ? "Não informado" : currency.format(Number(detail.unitValue))],
              ["Idade permitida", detail.minimumAge === null && detail.maximumAge === null ? "Não informada" : `${detail.minimumAge ?? 0} a ${detail.maximumAge ?? "sem limite"}`],
              ["Sexo permitido", detail.allowedSex], ["Financiamento", detail.financing], ["CIDs relacionados", detail.cidCodes], ["CBOs relacionados", detail.cboCodes],
              ["Serviços relacionados", detail.serviceCodes], ["Classificações relacionadas", detail.classificationCodes], ["Origem registrada", detail.origin], ["Arquivo", detail.fileName],
            ].map(([label, value]) => <div key={String(label)} className={String(value).length > 80 ? "sm:col-span-2" : ""}><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-0.5 break-words text-slate-800">{value || "Não informado"}</dd></div>)}
            <div className="sm:col-span-2"><dt className="text-xs font-semibold text-slate-500">Versões registradas</dt><dd className="mt-1 max-h-36 overflow-y-auto rounded border border-slate-200">{detail.versions.map(version => <div key={version.id} className="grid grid-cols-[90px_90px_1fr] gap-2 border-b border-slate-100 px-2 py-1.5 text-xs last:border-b-0"><span>{version.competence}</span><strong>{version.isCurrent ? "Atual" : "Histórica"}</strong><span className="truncate" title={`${version.origin} · ${version.fileName}`}>{version.origin} · {version.fileName}</span></div>)}</dd></div>
          </dl>}
          <DialogFooter><Button type="button" variant="outline" onClick={() => setDetail(null)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
