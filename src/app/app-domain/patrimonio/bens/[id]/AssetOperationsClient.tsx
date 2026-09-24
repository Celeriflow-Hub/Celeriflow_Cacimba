"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fieldClass, ReferencePicker } from "@/app/app-domain/frotas/ReferencePicker";
import type { AssetOperationInput } from "@/lib/patrimonio/asset-operations";
import { operateAssetAction } from "./actions";

type Maintenance = { id: string; description: string; startDate: string; status: string; fleetOrderId: string | null };
export function AssetOperationsClient({ assetId, version, canUpdate, maintenances }: { assetId: string; version: string; canUpdate: boolean; maintenances: Maintenance[] }) {
  const router = useRouter(), locked = useRef(false);
  const [pending, startTransition] = useTransition();
  const [departmentId, setDepartmentId] = useState(""), [responsibleId, setResponsibleId] = useState("");
  const [message, setMessage] = useState(""), [error, setError] = useState("");
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
  function confirm(input: AssetOperationInput) {
    if (locked.current) return; locked.current = true; setError(""); setMessage("");
    startTransition(async () => {
      try { const result = await operateAssetAction(input); setError(result.error || ""); setMessage(result.message || ""); if (!result.error) router.refresh(); }
      catch { setError("Não foi possível consultar a confirmação. Reabra a ficha antes de tentar novamente."); }
      finally { locked.current = false; }
    });
  }
  if (!canUpdate) return <p className="text-sm text-slate-500">Seu perfil permite consultar os dados e o histórico deste bem.</p>;
  return <div className="space-y-3">
    {message && <p role="status" className="rounded border border-teal-200 bg-teal-50 p-3 text-sm">{message}</p>}{error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <div className="grid gap-3 lg:grid-cols-2">
      <form className="space-y-3 rounded-md border bg-white p-4" onSubmit={event => { event.preventDefault(); const values = new FormData(event.currentTarget); confirm({ kind: "transfer", assetId, version, departmentId, responsibleId, reason: String(values.get("reason") || "") }); }}>
        <h2 className="font-semibold">Transferir setor ou responsável</h2><p className="text-xs text-slate-500">O histórico permanece vinculado ao bem. O acesso em Frotas passa ao setor de destino. Agregados de outro setor são desvinculados da unidade principal.</p>
        <label className="block text-sm">Setor de destino<ReferencePicker endpoint="/api/patrimonio/referencias" kind="departments" label="Setor de destino" value={departmentId} required onChange={value => { setDepartmentId(value); setResponsibleId(""); }} /></label>
        <label className="block text-sm">Responsável de destino<ReferencePicker endpoint="/api/patrimonio/referencias" kind="employees" departmentId={departmentId} label="Responsável de destino" value={responsibleId} onChange={setResponsibleId} /></label>
        <label className="block text-sm">Justificativa<textarea name="reason" required maxLength={10000} className={fieldClass + " mt-1 min-h-20"} /></label>
        <button disabled={pending} className="min-h-9 rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Confirmar transferência</button>
      </form>
      <form className="space-y-3 rounded-md border bg-white p-4" onSubmit={event => { event.preventDefault(); const values = new FormData(event.currentTarget); confirm({ kind: "startMaintenance", assetId, version, description: String(values.get("description") || ""), startDate: String(values.get("startDate") || "") }); }}>
        <h2 className="font-semibold">Iniciar manutenção patrimonial</h2><p className="text-xs text-slate-500">A unidade vinculada fica em manutenção. Se há OS de Frotas, inicie pela própria OS para preservar o plano de origem.</p>
        <label className="block text-sm">Data de início<input name="startDate" type="date" defaultValue={today} required className={fieldClass + " mt-1"} /></label>
        <label className="block text-sm">Serviços / descrição<textarea name="description" required maxLength={10000} className={fieldClass + " mt-1 min-h-20"} /></label>
        <button disabled={pending} className="min-h-9 rounded border border-amber-600 px-4 py-2 text-sm font-medium text-amber-700 disabled:opacity-50">Iniciar manutenção</button>
      </form>
    </div>
    {maintenances.filter(m => m.status !== "Concluída").map(m => <form key={m.id} className="space-y-3 rounded-md border bg-white p-4" onSubmit={event => { event.preventDefault(); const values = new FormData(event.currentTarget); confirm({ kind: "completeMaintenance", maintenanceId: m.id, endDate: String(values.get("endDate") || ""), description: String(values.get("description") || ""), cost: String(values.get("cost") || "") }); }}>
      <h2 className="font-semibold">Concluir manutenção · {m.id}</h2><p className="text-xs text-slate-500">{m.fleetOrderId ? `Atualiza a OS ${m.fleetOrderId} e sua próxima ocorrência.` : "Aparece automaticamente no histórico de Frotas, quando há unidade vinculada."} Serviços e materiais consumidos são apropriados separadamente.</p>
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Data de conclusão<input type="date" name="endDate" required defaultValue={today} className={fieldClass + " mt-1"} /></label><label className="text-sm">Custo dos serviços (R$)<input type="number" name="cost" min="0" step="0.01" className={fieldClass + " mt-1"} /><span className="text-xs text-slate-500">Vazio = desconhecido. Exclua consumos já registrados.</span></label></div>
      <label className="block text-sm">Serviços executados<textarea name="description" required maxLength={10000} defaultValue={m.description} className={fieldClass + " mt-1 min-h-20"} /></label>
      <button disabled={pending} className="min-h-9 rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Concluir e apropriar uma única vez</button>
    </form>)}
  </div>;
}
