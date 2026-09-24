"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ErpStatusBadge,
  ErpTableContainer,
  ErpTableTd,
  ErpTableTh,
  ErpTableThead,
  ErpTableTr,
} from "@/components/app-ui/erp/ErpTable";
import { saveLaboratoryConfiguration } from "./actions";

export type LaboratoryRow = {
  id: string;
  unitId: string;
  unitName: string;
  laboratoryName: string;
  collectionStartTime: string;
  collectionEndTime: string;
  resultReleaseDays: number;
  allowsExternalProcessing: boolean;
  requiresTechnicalReview: boolean;
  usesDigitalSignature: boolean;
  publishesPatientPortal: boolean;
  resultFooterMessage: string | null;
  effectiveFrom: string;
  effectiveUntil: string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
};
type Unit = { id: string; name: string };
const empty = {
  unitId: "",
  laboratoryName: "",
  collectionStartTime: "07:00",
  collectionEndTime: "11:00",
  resultReleaseDays: 3,
  allowsExternalProcessing: false,
  requiresTechnicalReview: true,
  usesDigitalSignature: false,
  publishesPatientPortal: false,
  resultFooterMessage: "",
  effectiveFrom: new Date().toISOString().slice(0, 10),
  effectiveUntil: "",
};

export function LaboratoryClient({
  rows,
  units,
  canUpdate,
}: {
  rows: LaboratoryRow[];
  units: Unit[];
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<typeof empty | null>(null);
  const [detail, setDetail] = useState<LaboratoryRow | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  function edit(row?: LaboratoryRow) {
    setMessage("");
    setEditing(
      row
        ? {
            unitId: row.unitId,
            laboratoryName: row.laboratoryName,
            collectionStartTime: row.collectionStartTime,
            collectionEndTime: row.collectionEndTime,
            resultReleaseDays: row.resultReleaseDays,
            allowsExternalProcessing: row.allowsExternalProcessing,
            requiresTechnicalReview: row.requiresTechnicalReview,
            usesDigitalSignature: row.usesDigitalSignature,
            publishesPatientPortal: row.publishesPatientPortal,
            resultFooterMessage: row.resultFooterMessage || "",
            effectiveFrom: row.effectiveFrom,
            effectiveUntil: row.effectiveUntil || "",
          }
        : { ...empty, unitId: units[0]?.id || "" },
    );
  }
  async function save() {
    if (!editing) return;
    setPending(true);
    const result = await saveLaboratoryConfiguration({
      ...editing,
      resultFooterMessage: editing.resultFooterMessage || null,
      effectiveUntil: editing.effectiveUntil || null,
    });
    setPending(false);
    if ("error" in result) return setMessage(result.error);
    setEditing(null);
    setMessage(
      "Configuração salva. A versão anterior foi preservada no histórico.",
    );
    startTransition(() => router.refresh());
  }
  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex shrink-0 items-center justify-between border-b p-2">
          <span className="text-[11px] text-slate-500">
            {rows.length} registro(s) nesta página
          </span>
          {canUpdate && (
            <Button size="sm" onClick={() => edit()}>
              <Plus className="size-3.5" />
              Nova configuração
            </Button>
          )}
        </div>
        {message && (
          <p
            role="status"
            className="shrink-0 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"
          >
            {message}
          </p>
        )}
        <ErpTableContainer className="overflow-y-auto overflow-x-hidden">
          <ErpTableThead>
            <ErpTableTr>
              <ErpTableTh>Laboratório / unidade</ErpTableTh>
              <ErpTableTh className="hidden md:table-cell">Coleta</ErpTableTh>
              <ErpTableTh className="hidden lg:table-cell">Vigência</ErpTableTh>
              <ErpTableTh className="w-[100px]">Situação</ErpTableTh>
              <ErpTableTh className="w-[80px] text-center">Ações</ErpTableTh>
            </ErpTableTr>
          </ErpTableThead>
          <tbody>
            {rows.map((row) => (
              <ErpTableTr key={row.id}>
                <ErpTableTd>
                  <strong>{row.laboratoryName}</strong>
                  <br />
                  <span className="text-[11px] text-slate-500">
                    {row.unitName}
                  </span>
                </ErpTableTd>
                <ErpTableTd className="hidden md:table-cell">
                  {row.collectionStartTime} às {row.collectionEndTime}
                </ErpTableTd>
                <ErpTableTd className="hidden lg:table-cell">
                  {new Date(`${row.effectiveFrom}T12:00:00`).toLocaleDateString(
                    "pt-BR",
                  )}{" "}
                  {row.effectiveUntil
                    ? `a ${new Date(`${row.effectiveUntil}T12:00:00`).toLocaleDateString("pt-BR")}`
                    : "em diante"}
                </ErpTableTd>
                <ErpTableTd>
                  <ErpStatusBadge
                    variant={row.isActive ? "success" : "neutral"}
                  >
                    {row.isActive ? "Atual" : "Histórica"}
                  </ErpStatusBadge>
                </ErpTableTd>
                <ErpTableTd>
                  <div className="flex justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDetail(row)}
                      className="inline-flex size-7 items-center justify-center rounded border"
                      aria-label={`Abrir ${row.laboratoryName}`}
                    >
                      <Eye className="size-3.5" />
                    </button>
                    {canUpdate && row.isActive && (
                      <button
                        type="button"
                        onClick={() => edit(row)}
                        className="rounded border px-2 text-[10px] font-bold"
                      >
                        Alterar
                      </button>
                    )}
                  </div>
                </ErpTableTd>
              </ErpTableTr>
            ))}
          </tbody>
        </ErpTableContainer>
      </div>
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configuração laboratorial</DialogTitle>
            <DialogDescription>
              Parâmetros administrativos e vigência por unidade.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-xs font-semibold sm:col-span-2">
                Unidade
                <select
                  value={editing.unitId}
                  onChange={(event) =>
                    setEditing({ ...editing, unitId: event.target.value })
                  }
                  className="h-9 rounded border bg-white px-2"
                >
                  <option value="">Selecione</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-semibold sm:col-span-2">
                Laboratório
                <input
                  value={editing.laboratoryName}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      laboratoryName: event.target.value,
                    })
                  }
                  className="h-9 rounded border px-2"
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold">
                Início da coleta
                <input
                  type="time"
                  value={editing.collectionStartTime}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      collectionStartTime: event.target.value,
                    })
                  }
                  className="h-9 rounded border px-2"
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold">
                Fim da coleta
                <input
                  type="time"
                  value={editing.collectionEndTime}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      collectionEndTime: event.target.value,
                    })
                  }
                  className="h-9 rounded border px-2"
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold">
                Prazo de resultados (dias)
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={editing.resultReleaseDays}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      resultReleaseDays: Number(event.target.value),
                    })
                  }
                  className="h-9 rounded border px-2"
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold">
                Início da vigência
                <input
                  type="date"
                  value={editing.effectiveFrom}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      effectiveFrom: event.target.value,
                    })
                  }
                  className="h-9 rounded border px-2"
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold">
                Fim da vigência
                <input
                  type="date"
                  value={editing.effectiveUntil}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      effectiveUntil: event.target.value,
                    })
                  }
                  className="h-9 rounded border px-2"
                />
              </label>
              <div className="flex flex-col justify-end gap-2 text-xs">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editing.allowsExternalProcessing}
                    onChange={(event) =>
                      setEditing({
                        ...editing,
                        allowsExternalProcessing: event.target.checked,
                      })
                    }
                  />
                  Permitir processamento externo
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editing.requiresTechnicalReview}
                    onChange={(event) =>
                      setEditing({
                        ...editing,
                        requiresTechnicalReview: event.target.checked,
                      })
                    }
                  />
                  Exigir revisão técnica
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editing.usesDigitalSignature}
                    onChange={(event) => setEditing({ ...editing, usesDigitalSignature: event.target.checked })}
                  />
                  Exigir assinatura digital
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editing.publishesPatientPortal}
                    onChange={(event) => setEditing({ ...editing, publishesPatientPortal: event.target.checked })}
                  />
                  Permitir publicação ao paciente
                </label>
              </div>
              <label className="grid gap-1 text-xs font-semibold sm:col-span-2">
                Mensagem do resultado
                <textarea
                  value={editing.resultFooterMessage}
                  onChange={(event) => setEditing({ ...editing, resultFooterMessage: event.target.value })}
                  className="min-h-16 rounded border p-2"
                />
              </label>
              {message && (
                <p className="text-xs font-semibold text-rose-700 sm:col-span-2">
                  {message}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={pending}>
              {pending ? "Salvando..." : "Salvar configuração"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(detail)}
        onOpenChange={(open) => !open && setDetail(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detail?.laboratoryName}</DialogTitle>
            <DialogDescription>{detail?.unitName}</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <p>
                <b>Coleta:</b>
                <br />
                {detail.collectionStartTime} às {detail.collectionEndTime}
              </p>
              <p>
                <b>Resultado:</b>
                <br />
                até {detail.resultReleaseDays} dia(s)
              </p>
              <p>
                <b>Processamento externo:</b>
                <br />
                {detail.allowsExternalProcessing
                  ? "Permitido"
                  : "Não permitido"}
              </p>
              <p>
                <b>Revisão técnica:</b>
                <br />
                {detail.requiresTechnicalReview ? "Obrigatória" : "Dispensada"}
              </p>
              <p><b>Assinatura digital:</b><br />{detail.usesDigitalSignature ? "Obrigatória" : "Não exigida"}</p>
              <p><b>Publicação ao paciente:</b><br />{detail.publishesPatientPortal ? "Permitida" : "Não permitida"}</p>
              {detail.resultFooterMessage && <p className="col-span-2"><b>Mensagem:</b><br />{detail.resultFooterMessage}</p>}
              <p>
                <b>Responsável:</b>
                <br />
                {detail.createdBy}
              </p>
              <p>
                <b>Registrada em:</b>
                <br />
                {new Date(detail.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetail(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
