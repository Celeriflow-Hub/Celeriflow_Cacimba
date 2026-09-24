"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { approveMaterialRequestAction, issueMaterialRequestInFullAction } from "../actions";

type RequestItem = {
  id: string;
  quantityRequested: number;
  quantityApproved: number;
  quantityDelivered: number;
  material: { id: string; code: string; name: string; unitOfMeasure: string };
};

type Request = { id: string; number: string; status: string; items: RequestItem[] };
type Stock = { id: string; materialId: string; quantity: number; batchNumber: string; warehouse: { name: string } };

export function MaterialRequestWorkflowClient({ request, stocks }: { request: Request; stocks: Stock[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [approvedQuantities, setApprovedQuantities] = useState(() => Object.fromEntries(request.items.map((item) => [item.id, item.quantityRequested])));
  const [stockByItem, setStockByItem] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const canApprove = request.status === "Pendente";
  const remainingItems = request.items.filter((item) => item.quantityApproved > item.quantityDelivered);
  const canIssueInFull = request.status === "Aprovada" || request.status === "Atendida Parcialmente";

  function approve() {
    setFeedback(null);
    startTransition(async () => {
      const result = await approveMaterialRequestAction(
        request.id,
        request.items.map((item) => ({ itemId: item.id, quantityApproved: Number(approvedQuantities[item.id]) })),
      );
      if (result.error) setFeedback(result.error);
      else router.refresh();
    });
  }

  function issueInFull() {
    setFeedback(null);
    startTransition(async () => {
      const result = await issueMaterialRequestInFullAction({
        requestId: request.id,
        stockByItem: remainingItems.map((item) => ({ requestItemId: item.id, stockId: stockByItem[item.id] ?? "" })),
      });
      if (result.error) setFeedback(result.error);
      else router.refresh();
    });
  }

  return (
    <section className="space-y-3 rounded-md border bg-white p-4">
      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-[720px] w-full text-sm">
          <thead className="border-b bg-muted text-left text-muted-foreground"><tr><th className="p-3 font-medium">Material</th><th className="p-3 font-medium">Solicitado</th><th className="p-3 font-medium">Aprovado</th><th className="p-3 font-medium">Entregue</th>{canIssueInFull && <th className="p-3 font-medium">Estoque para entrega</th>}</tr></thead>
          <tbody>
            {request.items.map((item) => {
              const availableStocks = stocks.filter((stock) => stock.materialId === item.material.id);
              const remaining = item.quantityApproved - item.quantityDelivered;
              return (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{item.material.code} - {item.material.name} <span className="text-muted-foreground">({item.material.unitOfMeasure})</span></td>
                  <td className="p-3">{item.quantityRequested}</td>
                  <td className="p-3">{canApprove ? <Input type="number" min="0" max={item.quantityRequested} step="any" value={approvedQuantities[item.id] ?? 0} onChange={(event) => setApprovedQuantities((current) => ({ ...current, [item.id]: Number(event.target.value) }))} /> : item.quantityApproved}</td>
                  <td className="p-3">{item.quantityDelivered}</td>
                  {canIssueInFull && <td className="p-3">{remaining > 0 ? <select value={stockByItem[item.id] ?? ""} onChange={(event) => setStockByItem((current) => ({ ...current, [item.id]: event.target.value }))} className="h-9 min-w-64 rounded-md border bg-background px-3 text-sm"><option value="">Selecione a posição</option>{availableStocks.map((stock) => <option key={stock.id} value={stock.id}>{stock.warehouse.name} · lote {stock.batchNumber || "sem lote"} · saldo {stock.quantity}</option>)}</select> : "Sem saldo pendente"}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t pt-3">
        {feedback && <p className="mr-auto text-sm text-destructive" role="status">{feedback}</p>}
        {canApprove && <Button type="button" onClick={approve} disabled={pending}>Aprovar requisição</Button>}
        {canIssueInFull && <Button type="button" onClick={issueInFull} disabled={pending || remainingItems.some((item) => !stockByItem[item.id])}>{pending ? "Registrando..." : "Entregar saldo integral"}</Button>}
      </div>
    </section>
  );
}
