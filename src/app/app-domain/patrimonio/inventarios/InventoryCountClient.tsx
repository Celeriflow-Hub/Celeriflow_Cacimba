"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { closeApprovedInventoryAction, recordInventoryCountAction, submitInventoryForApprovalAction } from "./actions";

type Item = {
  id: string;
  expectedQuantity: number;
  countedQuantity: number | null;
  divergenceType: string;
  countEvidence: string | null;
  adjustmentReason: string | null;
  stock: { batchNumber: string; material: { code: string; name: string; unitOfMeasure: string } };
};

export function InventoryCountClient({ sessionId, status, items }: { sessionId: string; status: string; items: Item[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string>();
  const [pending, startTransition] = useTransition();

  function showResult(result: { error?: string; message?: string }) {
    setMessage(result.error ?? result.message);
    if (!result.error) router.refresh();
  }

  function saveCount(item: Item, form: HTMLFormElement) {
    const values = new FormData(form);
    const countedQuantity = Number(values.get("countedQuantity"));
    if (!Number.isFinite(countedQuantity)) {
      setMessage("Informe uma quantidade contada válida.");
      return;
    }
    startTransition(async () => showResult(await recordInventoryCountAction({
      sessionId,
      itemId: item.id,
      countedQuantity,
      divergenceType: String(values.get("divergenceType") || ""),
      countEvidence: String(values.get("countEvidence") || ""),
      adjustmentReason: String(values.get("adjustmentReason") || ""),
    })));
  }

  function submit() {
    startTransition(async () => showResult(await submitInventoryForApprovalAction({ sessionId })));
  }

  function close(form: HTMLFormElement) {
    const approvalEvidence = String(new FormData(form).get("approvalEvidence") || "");
    startTransition(async () => showResult(await closeApprovedInventoryAction({ sessionId, approvalEvidence })));
  }

  return (
    <div className="space-y-4">
      {message && <p className="rounded-md border bg-muted p-3 text-sm">{message}</p>}
      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-[900px] w-full text-left text-sm">
          <thead className="border-b bg-muted text-muted-foreground"><tr><th className="p-3">Material</th><th className="p-3">Lote</th><th className="p-3">Esperado</th><th className="p-3">Contado</th><th className="p-3">Divergência e evidência</th><th className="p-3">Ação</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b align-top last:border-0">
                <td className="p-3 font-medium">{item.stock.material.code} - {item.stock.material.name}<span className="block text-xs text-muted-foreground">{item.stock.material.unitOfMeasure}</span></td>
                <td className="p-3">{item.stock.batchNumber || "Sem lote"}</td>
                <td className="p-3">{item.expectedQuantity}</td>
                <td className="p-3">
                  {status === "COUNTING" ? (
                    <form onSubmit={(event) => { event.preventDefault(); saveCount(item, event.currentTarget); }} className="grid min-w-52 gap-2">
                      <input name="countedQuantity" type="number" min="0" step="any" defaultValue={item.countedQuantity ?? ""} className="h-9 rounded-md border px-2" />
                      <select name="divergenceType" defaultValue={item.divergenceType} className="h-9 rounded-md border bg-white px-2"><option value="SEM_DIVERGENCIA">Sem divergência</option><option value="SOBRA">Sobra</option><option value="FALTA">Falta</option><option value="VENCIDO">Vencido</option><option value="DANIFICADO">Danificado</option><option value="LOTE_DIVERGENTE">Lote divergente</option><option value="VALIDADE_DIVERGENTE">Validade divergente</option></select>
                      <textarea name="countEvidence" defaultValue={item.countEvidence ?? ""} placeholder="Evidência da divergência" className="min-h-16 rounded-md border p-2" />
                      <textarea name="adjustmentReason" defaultValue={item.adjustmentReason ?? ""} placeholder="Justificativa do ajuste" className="min-h-16 rounded-md border p-2" />
                      <button disabled={pending} className="rounded-md border px-3 py-2 font-medium disabled:opacity-50">Salvar contagem</button>
                    </form>
                  ) : <span>{item.countedQuantity ?? "-"}</span>}
                </td>
                <td className="p-3">{status === "COUNTING" ? "Preencha em caso de divergência." : <><div>{item.divergenceType.replaceAll("_", " ")}</div><div className="mt-1 text-xs text-muted-foreground">{item.countEvidence ?? "Sem evidência adicional"}</div><div className="mt-1 text-xs text-muted-foreground">{item.adjustmentReason ?? "Sem ajuste"}</div></>}</td>
                <td className="p-3">{status === "CLOSED" ? "Encerrado" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {status === "COUNTING" && <button type="button" onClick={submit} disabled={pending} className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Enviar para aprovação</button>}
      {status === "PENDING_APPROVAL" && <form onSubmit={(event) => { event.preventDefault(); close(event.currentTarget); }} className="flex max-w-2xl flex-col gap-2 rounded-md border p-4"><label className="text-sm font-medium">Evidência da aprovação (processo, despacho ou documento)</label><textarea name="approvalEvidence" required className="min-h-20 rounded-md border p-2" /><button disabled={pending} className="w-fit rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Aprovar, ajustar e encerrar</button></form>}
    </div>
  );
}
