"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approvePurchaseReceiptAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Contract = {
  id: string;
  number: string;
  process: { items: Array<{ id: string; quantity: number; estimatedUnitValue: number | null; material: { id: string; name: string; type: string } | null }> };
};
type Option = { id: string; name: string };
type DocumentOption = { id: string; title: string };
type ReceiptItemState = { purchaseProcessItemId: string; materialId: string; warehouseId: string; quantity: number; unitCost: number; batchNumber: string; expirationDate: string; brand: string; model: string; serialNumber: string };

export function ReceiptForm({ contracts, documents, employees, warehouses }: { contracts: Contract[]; documents: DocumentOption[]; employees: Option[]; warehouses: Option[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [contractId, setContractId] = useState("");
  const [data, setData] = useState({ number: "", receivedAt: new Date().toISOString().slice(0, 10), documentId: "", receiverId: "", attesterId: "" });
  const contract = contracts.find((item) => item.id === contractId);
  const processItems = contract?.process.items.filter((item): item is typeof item & { material: { id: string; name: string } } => Boolean(item.material)) ?? [];
  const [items, setItems] = useState<ReceiptItemState[]>([]);

  function selectContract(id: string) {
    setContractId(id);
    const selected = contracts.find((item) => item.id === id);
    setItems((selected?.process.items ?? []).flatMap((item) => item.material ? [{
      purchaseProcessItemId: item.id,
      materialId: item.material.id,
      warehouseId: "",
      quantity: item.quantity,
        unitCost: item.estimatedUnitValue ?? 0,
        batchNumber: "",
        expirationDate: "",
        brand: "",
        model: "",
        serialNumber: "",
    }] : []));
  }

  function updateItem(index: number, values: Partial<ReceiptItemState>) {
    setItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...values } : item));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!contractId) return alert("Selecione o contrato vigente.");
    if (!items.length || items.some((item) => !item.warehouseId || item.quantity <= 0)) return alert("Informe almoxarifado e quantidade recebida para todos os itens.");
    if (items.some((item, index) => processItems[index]?.material.type === "PATRIMONIO" && !Number.isInteger(item.quantity))) return alert("Itens patrimoniais devem ser recebidos em quantidade inteira.");
    if (items.some((item, index) => processItems[index]?.material.type === "PATRIMONIO" && item.serialNumber.trim() && item.quantity !== 1)) return alert("Para informar número de série, registre cada item patrimonial em quantidade unitária.");
    setPending(true);
    const result = await approvePurchaseReceiptAction({
      number: data.number,
      receivedAt: new Date(`${data.receivedAt}T12:00:00.000Z`),
      contractId,
      documentId: data.documentId,
      receiverId: data.receiverId,
      attesterId: data.attesterId,
      idempotencyKey: `UI:${contractId}:${data.number}`,
      items: items.map((item) => ({
        purchaseProcessItemId: item.purchaseProcessItemId,
        materialId: item.materialId,
        warehouseId: item.warehouseId,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
        batchNumber: item.batchNumber || undefined,
        expirationDate: item.expirationDate ? new Date(`${item.expirationDate}T12:00:00.000Z`) : undefined,
        brand: item.brand || undefined,
        model: item.model || undefined,
        serialNumber: item.serialNumber || undefined,
      })),
    });
    setPending(false);
    if (result.error) return alert(result.error);
    router.push("/compras/recebimentos");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2"><Label>Número do recebimento</Label><Input required value={data.number} onChange={(event) => setData({ ...data, number: event.target.value })} placeholder="REC-001/2026" /></div>
        <div className="space-y-2"><Label>Data do recebimento</Label><Input required type="date" value={data.receivedAt} onChange={(event) => setData({ ...data, receivedAt: event.target.value })} /></div>
        <div className="space-y-2"><Label>Contrato vigente</Label><Select value={contractId} onValueChange={(value) => selectContract(value ?? "")}><SelectTrigger><SelectValue placeholder="Selecione o contrato" /></SelectTrigger><SelectContent>{contracts.map((item) => <SelectItem key={item.id} value={item.id}>{item.number}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>Documento GED válido</Label><Select value={data.documentId} onValueChange={(documentId) => setData({ ...data, documentId: documentId ?? "" })}><SelectTrigger><SelectValue placeholder="Selecione o documento" /></SelectTrigger><SelectContent>{documents.map((item) => <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>Recebedor</Label><Select value={data.receiverId} onValueChange={(receiverId) => setData({ ...data, receiverId: receiverId ?? "" })}><SelectTrigger><SelectValue placeholder="Servidor que recebeu" /></SelectTrigger><SelectContent>{employees.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>Atestador</Label><Select value={data.attesterId} onValueChange={(attesterId) => setData({ ...data, attesterId: attesterId ?? "" })}><SelectTrigger><SelectValue placeholder="Servidor que atestou" /></SelectTrigger><SelectContent>{employees.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
      </div>

      {contract && !processItems.length && <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">O processo deste contrato não possui itens de material vinculados ao almoxarifado.</p>}
      {items.length > 0 && <div className="space-y-3 border-t pt-3"><h2 className="text-sm font-semibold">Itens recebidos</h2>{items.map((item, index) => <div key={item.purchaseProcessItemId} className="grid gap-3 rounded-md border p-3 md:grid-cols-4"><div className="text-sm font-medium md:col-span-2">{processItems[index]?.material.name}</div><div className="space-y-1"><Label>Almoxarifado</Label><Select value={item.warehouseId} onValueChange={(warehouseId) => updateItem(index, { warehouseId: warehouseId ?? "" })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{warehouses.map((warehouse) => <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1"><Label>Quantidade</Label><Input type="number" min="0.0001" max={processItems[index]?.quantity} step="any" value={item.quantity} onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })} /></div><div className="space-y-1"><Label>Custo unitário</Label><Input type="number" min="0" step="0.01" value={item.unitCost} onChange={(event) => updateItem(index, { unitCost: Number(event.target.value) })} /></div><div className="space-y-1"><Label>Lote</Label><Input value={item.batchNumber} onChange={(event) => updateItem(index, { batchNumber: event.target.value })} /></div><div className="space-y-1"><Label>Validade</Label><Input type="date" value={item.expirationDate} onChange={(event) => updateItem(index, { expirationDate: event.target.value })} /></div><div className="space-y-1"><Label>Marca</Label><Input value={item.brand} onChange={(event) => updateItem(index, { brand: event.target.value })} /></div><div className="space-y-1"><Label>Modelo</Label><Input value={item.model} onChange={(event) => updateItem(index, { model: event.target.value })} /></div><div className="space-y-1"><Label>Número de série</Label><Input value={item.serialNumber} onChange={(event) => updateItem(index, { serialNumber: event.target.value })} /></div>{processItems[index]?.material.type === "PATRIMONIO" && <p className="text-xs text-slate-500 md:col-span-4">Itens patrimoniais são recebidos em unidades inteiras. Informe o número de série somente em uma linha com quantidade 1.</p>}</div>)}</div>}
      <Button type="submit" disabled={pending || !contract || !items.length}>{pending ? "Aprovando..." : "Aprovar recebimento e registrar entrada"}</Button>
    </form>
  );
}
