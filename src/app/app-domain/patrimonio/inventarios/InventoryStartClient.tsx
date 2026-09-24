"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createInventorySessionAction } from "./actions";

export function InventoryStartClient({ warehouses }: { warehouses: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [warehouseId, setWarehouseId] = useState("");
  const [message, setMessage] = useState<string>();
  const [pending, startTransition] = useTransition();

  function start() {
    setMessage(undefined);
    startTransition(async () => {
      const result = await createInventorySessionAction({ warehouseId });
      setMessage(result.error ?? result.message);
      if (!result.error) router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <label className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
        <span className="hidden lg:inline">Almoxarifado</span>
        <select value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)} className="h-8 min-w-44 max-w-64 rounded-md border border-input bg-white px-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <option value="">Selecione</option>
          {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
        </select>
      </label>
      <button type="button" onClick={start} disabled={pending || !warehouseId} className="h-8 rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
        {pending ? "Iniciando..." : "Iniciar inventário"}
      </button>
      {message && <p className="basis-full text-right text-[11px] text-muted-foreground" role="status">{message}</p>}
    </div>
  );
}
