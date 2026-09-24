"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { savePurchasePlanning } from "./actions";

type CatalogItemOption = {
  id: string;
  code: string | null;
  name: string;
  unit: string;
};

type PurchaseRequestOption = {
  id: string;
  number: string;
  object: string;
  status: string;
};

export type PurchasePlanningFormData = {
  id: string;
  description: string | null;
  catalogItemId: string | null;
  originPurchaseRequestId: string | null;
  unit: string;
  quantity: number;
  expectedPeriodStart: string;
  expectedPeriodEnd: string;
  estimatedValueDecimal: number;
  status: string;
};

type PlanningFormProps = {
  data?: PurchasePlanningFormData;
  catalogItems: CatalogItemOption[];
  purchaseRequests: PurchaseRequestOption[];
};

export function PlanningForm({ data, catalogItems, purchaseRequests }: PlanningFormProps) {
  const router = useRouter();
  const [unit, setUnit] = useState(data?.unit ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleCatalogItemChange(catalogItemId: string) {
    const catalogItem = catalogItems.find((item) => item.id === catalogItemId);
    if (catalogItem) setUnit(catalogItem.unit);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      const result = await savePurchasePlanning(new FormData(event.currentTarget));
      if (!result.success) {
        setFeedback(result.error);
        return;
      }

      router.push(`/compras/planejamento/${result.id}`);
      router.refresh();
    } catch {
      setFeedback("Não foi possível salvar o planejamento de compra. Atualize a página e tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageFrame className="space-y-2">
      <PageHeader
        title={data ? "Editar planejamento de compra" : "Novo planejamento de compra"}
        action={<Link href="/compras/planejamento" aria-label="Voltar para planejamentos"><Button variant="outline" size="icon"><ArrowLeft className="size-4" /></Button></Link>}
      />
      <Card className="max-w-4xl rounded-md">
        <CardHeader className="border-b p-3"><CardTitle className="text-sm">Necessidade futura de compra</CardTitle></CardHeader>
        <CardContent className="p-3">
          <form onSubmit={handleSubmit} className="space-y-4">
            {data ? <input type="hidden" name="id" value={data.id} /> : null}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="catalogItemId">Item ou serviço do catálogo</Label>
                <select
                  id="catalogItemId"
                  name="catalogItemId"
                  defaultValue={data?.catalogItemId ?? ""}
                  onChange={(event) => handleCatalogItemChange(event.target.value)}
                  className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Especificação livre</option>
                  {catalogItems.map((item) => <option key={item.id} value={item.id}>{item.code ? `${item.code} · ` : ""}{item.name} ({item.unit})</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="originPurchaseRequestId">Solicitação de origem</Label>
                <select id="originPurchaseRequestId" name="originPurchaseRequestId" defaultValue={data?.originPurchaseRequestId ?? ""} className="flex h-9 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="">Sem solicitação vinculada</option>
                  {purchaseRequests.map((request) => <option key={request.id} value={request.id}>{request.number} · {request.object} ({request.status})</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Especificação da necessidade</Label>
              <Textarea id="description" name="description" rows={4} defaultValue={data?.description ?? ""} placeholder="Obrigatória quando não houver item de catálogo." />
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-2"><Label htmlFor="quantity">Quantidade</Label><Input id="quantity" name="quantity" required type="number" min="0.001" step="0.001" defaultValue={data?.quantity ?? ""} /></div>
              <div className="space-y-2"><Label htmlFor="unit">Unidade de medida</Label><Input id="unit" name="unit" required value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="Ex.: resma, hora" /></div>
              <div className="space-y-2"><Label htmlFor="expectedPeriodStart">Início esperado</Label><Input id="expectedPeriodStart" name="expectedPeriodStart" required type="date" defaultValue={data?.expectedPeriodStart ?? ""} /></div>
              <div className="space-y-2"><Label htmlFor="expectedPeriodEnd">Fim esperado</Label><Input id="expectedPeriodEnd" name="expectedPeriodEnd" required type="date" defaultValue={data?.expectedPeriodEnd ?? ""} /></div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="estimatedValueDecimal">Valor estimado (R$)</Label><Input id="estimatedValueDecimal" name="estimatedValueDecimal" required type="number" min="0" step="0.01" defaultValue={data?.estimatedValueDecimal ?? ""} /></div>
              <div className="space-y-2"><Label htmlFor="status">Situação</Label><select id="status" name="status" defaultValue={data?.status ?? "Rascunho"} className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="Rascunho">Rascunho</option><option value="Planejado">Planejado</option><option value="Cancelado">Cancelado</option></select></div>
            </div>
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">Este registro apenas organiza uma necessidade futura. Salvar o planejamento não cria processo, contratação, reserva, empenho ou despesa.</p>
            {feedback ? <p role="alert" className="text-sm text-rose-700">{feedback}</p> : null}
            <div className="flex justify-end gap-2 border-t pt-3"><Link href="/compras/planejamento"><Button type="button" variant="outline">Cancelar</Button></Link><Button type="submit" disabled={isSaving}><Save className="size-4" />{isSaving ? "Salvando..." : "Salvar planejamento"}</Button></div>
          </form>
        </CardContent>
      </Card>
    </PageFrame>
  );
}
