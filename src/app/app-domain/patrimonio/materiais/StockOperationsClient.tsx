"use client";

import { adjustMaterialStockAction, registerMaterialExitAction } from "./actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Option = { id: string; label: string };
type Operation = "EXIT" | "ADJUSTMENT";
type SettlementOption = { id: string; label: string };

export function StockOperationsClient({ materials, warehouses, settlements }: { materials: Option[]; warehouses: Option[]; settlements: SettlementOption[] }) {
  const router = useRouter();
  const [operation, setOperation] = useState<Operation>("EXIT");
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function submit(formData: FormData) {
    const unitCost = formData.get("unitCost");
    const data = {
      warehouseId: String(formData.get("warehouseId") ?? ""),
      materialId: String(formData.get("materialId") ?? ""),
      batchNumber: String(formData.get("batchNumber") ?? "") || undefined,
      expirationDate: String(formData.get("expirationDate") ?? "") || undefined,
      unitCost: typeof unitCost === "string" && unitCost !== "" ? Number(unitCost) : undefined,
      reason: String(formData.get("reason") ?? "") || undefined,
      settlementId: String(formData.get("settlementId") ?? "") || undefined,
      quantity: Number(formData.get("quantity")),
    };

    startTransition(async () => {
      const result = operation === "EXIT"
        ? await registerMaterialExitAction(data)
        : await adjustMaterialStockAction(data);
      setFeedback(result.error ?? result.message ?? null);
      if (!result.error) router.refresh();
    });
  }

  if (!materials.length || !warehouses.length) {
    return <p className="text-sm text-muted-foreground">Cadastre ao menos um material e um almoxarifado para movimentar o estoque.</p>;
  }

  const labels = { EXIT: "Saída", ADJUSTMENT: "Ajuste" } as const;
  return (
    <form action={submit} className="grid gap-3 text-sm md:grid-cols-2">
      <div className="md:col-span-2 flex flex-wrap gap-2" role="group" aria-label="Tipo de movimentação">
        {(Object.keys(labels) as Operation[]).map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => setOperation(kind)}
            className={`rounded-md border px-3 py-2 text-sm font-medium ${operation === kind ? "bg-primary text-primary-foreground" : "bg-background"}`}
          >
            {labels[kind]}
          </button>
        ))}
      </div>
      <label className="grid gap-1 text-sm font-medium">
        Almoxarifado
        <select name="warehouseId" required className="h-9 rounded-md border bg-background px-3 text-sm">
          <option value="">Selecione</option>
          {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.label}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Material
        <select name="materialId" required className="h-9 rounded-md border bg-background px-3 text-sm">
          <option value="">Selecione</option>
          {materials.map((material) => <option key={material.id} value={material.id}>{material.label}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Lote
        <input name="batchNumber" maxLength={100} className="h-9 rounded-md border bg-background px-3 text-sm" placeholder="Opcional" />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        {operation === "ADJUSTMENT" ? "Variação de saldo (+/-)" : "Quantidade"}
        <input name="quantity" type="number" required step="any" min={operation === "ADJUSTMENT" ? undefined : "0.000001"} className="h-9 rounded-md border bg-background px-3 text-sm" />
      </label>
      {operation !== "EXIT" && <label className="grid gap-1 text-sm font-medium">
        Validade
        <input name="expirationDate" type="date" className="h-9 rounded-md border bg-background px-3 text-sm" />
      </label>}
      {operation === "EXIT" && <label className="grid gap-1 text-sm font-medium md:col-span-2">
        Liquidação de referência
        <select name="settlementId" className="h-9 rounded-md border bg-background px-3 text-sm">
          <option value="">Não vincular a uma liquidação</option>
          {settlements.map((settlement) => <option key={settlement.id} value={settlement.id}>{settlement.label}</option>)}
        </select>
        <span className="text-xs font-normal text-muted-foreground">Opcional. Use quando a saída comprovar o recebimento de material liquidado; saídas para Obras continuam independentes.</span>
      </label>}
      {operation !== "EXIT" && <label className="grid gap-1 text-sm font-medium">
        Custo unitário
        <input name="unitCost" type="number" step="0.01" min="0" className="h-9 rounded-md border bg-background px-3 text-sm" />
      </label>}
      <label className="grid gap-1 text-sm font-medium md:col-span-2">
        Justificativa
        <input name="reason" required maxLength={500} className="h-9 rounded-md border bg-background px-3 text-sm" placeholder="Ex.: nota fiscal, consumo ou correção de saldo" />
      </label>
      <div className="md:col-span-2 flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
          {pending ? "Registrando..." : `Registrar ${labels[operation].toLowerCase()}`}
        </button>
        {feedback && <p className="text-sm text-muted-foreground" role="status">{feedback}</p>}
      </div>
    </form>
  );
}
