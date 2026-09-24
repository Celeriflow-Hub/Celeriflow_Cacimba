"use client";

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
import { calculateInclusiveContractTermDays, parseContractDate } from "@/lib/compras/contract-lifecycle";
import { saveCovenant } from "./actions";

type CovenantData = {
  id: string;
  number: string;
  grantor: string;
  description: string;
  totalValueDecimal: number;
  startDate: string;
  endDate: string;
  status: string;
};

function newIdempotencyKey() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function dateValue(value: string | undefined) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

export function ConvenioForm({ data }: { data?: CovenantData }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(dateValue(data?.startDate));
  const [endDate, setEndDate] = useState(dateValue(data?.endDate));
  const [idempotencyKey] = useState(newIdempotencyKey);
  const parsedStartDate = parseContractDate(startDate);
  const parsedEndDate = parseContractDate(endDate);
  let termDays: number | null = null;
  if (parsedStartDate && parsedEndDate) {
    try {
      termDays = calculateInclusiveContractTermDays(parsedStartDate, parsedEndDate);
    } catch {
      termDays = null;
    }
  }

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    setFeedback(null);
    try {
      const result = await saveCovenant(formData);
      if (!result.success) {
        setFeedback(result.error);
        return;
      }
      router.push("/compras/convenios");
    } catch {
      setFeedback("Não foi possível salvar o convênio. Atualize a página e tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageFrame className="space-y-2">
      <PageHeader title={data ? "Editar Convênio" : "Novo Convênio"} action={<Link href="/compras/convenios" aria-label="Voltar"><Button variant="outline" size="icon"><ArrowLeft className="size-4" /></Button></Link>} />
      <Card className="max-w-4xl rounded-md">
        <CardHeader className="border-b p-3"><CardTitle className="text-sm">Dados do Instrumento de Convênio</CardTitle></CardHeader>
        <CardContent className="p-3">
          <form action={handleSubmit} className="space-y-4">
            {data && <input type="hidden" name="id" value={data.id} />}
            <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="number">Número do convênio</Label><Input id="number" name="number" required defaultValue={data?.number ?? ""} placeholder="Ex.: CONV 001/2026" /></div>
              <div className="space-y-2"><Label htmlFor="grantor">Concedente</Label><Input id="grantor" name="grantor" required defaultValue={data?.grantor ?? ""} placeholder="Órgão ou entidade concedente" /></div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2"><Label htmlFor="startDate">Início da vigência</Label><Input id="startDate" name="startDate" required type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="endDate">Fim da vigência</Label><Input id="endDate" name="endDate" required type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="status">Situação</Label><select id="status" name="status" defaultValue={data?.status ?? "Ativo"} className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="Ativo">Ativo</option><option value="Suspenso">Suspenso</option><option value="Encerrado">Encerrado</option><option value="Rescindido">Rescindido</option><option value="Em análise">Em análise</option></select></div>
            </div>
            <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">Vigência calculada: {termDays ? `${termDays} dia${termDays === 1 ? "" : "s"} corrido${termDays === 1 ? "" : "s"}, com contagem inclusiva.` : "Informe datas válidas de início e término."}</p>
            <div className="space-y-2"><Label htmlFor="totalValueDecimal">Valor total do instrumento (R$)</Label><Input id="totalValueDecimal" name="totalValueDecimal" required type="number" min="0" step="0.01" defaultValue={data?.totalValueDecimal ?? ""} /></div>
            <div className="space-y-2"><Label htmlFor="description">Objeto / descrição</Label><Textarea id="description" name="description" required rows={5} defaultValue={data?.description ?? ""} /></div>
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">O cadastro não cria receita, empenho, liquidação, pagamento ou movimentação bancária. Esses atos permanecem nos módulos financeiros próprios.</p>
            {feedback && <p className="text-sm text-rose-700" role="status">{feedback}</p>}
            <div className="flex justify-end gap-2 border-t pt-3"><Link href="/compras/convenios"><Button type="button" variant="outline">Cancelar</Button></Link><Button type="submit" disabled={isSaving}><Save className="size-4" />{isSaving ? "Salvando..." : "Salvar convênio"}</Button></div>
          </form>
        </CardContent>
      </Card>
    </PageFrame>
  );
}
