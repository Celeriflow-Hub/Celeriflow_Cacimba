"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { createMaterialRequestAction } from "../actions";

type MaterialOption = { id: string; code: string; name: string; unitOfMeasure: string };
type ItemInput = { materialId: string; quantityRequested: number };

export function MaterialRequestForm({ materials }: { materials: MaterialOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const idempotencyKey = useRef(crypto.randomUUID());
  const [number, setNumber] = useState("");
  const [justification, setJustification] = useState("");
  const [items, setItems] = useState<ItemInput[]>([{ materialId: "", quantityRequested: 1 }]);
  const [feedback, setFeedback] = useState<string | null>(null);

  function updateItem(index: number, values: Partial<ItemInput>) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...values } : item));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result = await createMaterialRequestAction({
        number: number || undefined,
        justification: justification || undefined,
        idempotencyKey: idempotencyKey.current,
        items,
      });
      if (result.error) {
        setFeedback(result.error);
        return;
      }
      router.push("/patrimonio/requisicoes");
    });
  }

  return (
    <PageFrame className="max-w-4xl space-y-2">
      <PageHeader title="Nova Requisição de Material" action={<Link href="/patrimonio/requisicoes"><Button size="sm" variant="outline">Cancelar</Button></Link>} />
      <p className="text-xs text-muted-foreground">A requisição é vinculada ao setor e ao servidor autenticado. A aprovação e a entrega devem ser realizadas por fluxos autorizados distintos.</p>
      <form onSubmit={submit} className="space-y-4 rounded-md border bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium">
            Número de referência
            <Input value={number} maxLength={100} onChange={(event) => setNumber(event.target.value)} placeholder="Gerado automaticamente se vazio" />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Justificativa
            <Input value={justification} maxLength={1000} onChange={(event) => setJustification(event.target.value)} placeholder="Opcional" />
          </label>
        </div>

        <section className="space-y-3 border-t pt-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Itens solicitados</h2>
            <Button type="button" variant="outline" size="sm" onClick={() => setItems((current) => [...current, { materialId: "", quantityRequested: 1 }])}>Adicionar item</Button>
          </div>
          {items.map((item, index) => (
            <div key={index} className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_11rem_auto]">
              <label className="grid gap-1 text-sm font-medium">
                Material
                <select value={item.materialId} required onChange={(event) => updateItem(index, { materialId: event.target.value })} className="h-9 rounded-md border bg-background px-3 text-sm">
                  <option value="">Selecione</option>
                  {materials.map((material) => <option key={material.id} value={material.id}>{material.code} - {material.name} ({material.unitOfMeasure})</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Quantidade
                <Input type="number" required min="0.000001" step="any" value={item.quantityRequested} onChange={(event) => updateItem(index, { quantityRequested: Number(event.target.value) })} />
              </label>
              <div className="flex items-end">
                <Button type="button" variant="outline" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remover</Button>
              </div>
            </div>
          ))}
        </section>

        <div className="flex items-center justify-end gap-3 border-t pt-3">
          {feedback && <p className="mr-auto text-sm text-destructive" role="status">{feedback}</p>}
          <Link href="/patrimonio/requisicoes"><Button type="button" variant="outline">Cancelar</Button></Link>
          <Button type="submit" disabled={pending || !materials.length}>{pending ? "Registrando..." : "Registrar requisição"}</Button>
        </div>
      </form>
    </PageFrame>
  );
}
