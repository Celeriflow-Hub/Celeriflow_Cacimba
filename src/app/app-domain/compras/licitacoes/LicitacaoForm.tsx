"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveBidding } from "./actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { BIDDING_MODALITIES, biddingStatusLabel } from "@/lib/compras/bidding-workflow";

type BiddingData = {
  id: string;
  processId: string;
  number: string;
  modality: string;
  status: string;
  publicationDate: Date | null;
  sessionDate: Date | null;
};

type ProcessOption = {
  id: string;
  number: string;
  object: string;
  estimatedValue: number | null;
};

export function LicitacaoForm({ data, processos = [] }: { data?: BiddingData; processos?: ProcessOption[] }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState<string>(data?.processId || "");

  const selectedProcess = processos.find(p => p.id === selectedProcessId);
  const calculatedTotal = selectedProcess?.estimatedValue ?? 0;

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    try {
      const result = await saveBidding(formData);
      if (result.success) {
        router.push("/compras/licitacoes");
      } else {
        alert(result.error);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageFrame className="space-y-2">
      <PageHeader title={data ? "Editar Licitação" : "Nova Licitação"} action={<Link href="/compras/licitacoes" aria-label="Voltar"><Button variant="outline" size="icon"><ArrowLeft className="size-4" /></Button></Link>} />

      <Card className="max-w-4xl rounded-md">
        <CardHeader className="border-b p-3">
          <CardTitle className="text-sm">Dados do Certame</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <form action={handleSubmit} className="space-y-4">
            {data && <input type="hidden" name="id" value={data.id} />}
            
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="number">Número do Edital / Certame</Label>
                <Input id="number" name="number" defaultValue={data?.number || ""} required={Boolean(data)} placeholder="Auto-gerado por modalidade se vazio" />
                {!data && <p className="text-xs text-muted-foreground">A sequência automática é independente para cada modalidade.</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="modality">Modalidade</Label>
                {data ? (
                  <>
                    <Input value={data.modality} disabled />
                    <input type="hidden" name="modality" value={data.modality} />
                  </>
                ) : (
                  <Select name="modality" defaultValue="Pregão Eletrônico" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a modalidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {BIDDING_MODALITIES.map((modality) => <SelectItem key={modality} value={modality}>{modality}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {data && <p className="text-xs text-muted-foreground">A modalidade não é alterada depois da criação para manter a numeração atribuída.</p>}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Situação do certame</Label>
                <div className="flex min-h-9 items-center rounded-md border bg-muted/40 px-3 text-sm font-medium">
                  {data ? biddingStatusLabel(data.status) : "Em Elaboração"}
                </div>
                <p className="text-xs text-muted-foreground">As transições são registradas na ficha da licitação, após o cadastro.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="processId">Processo Vinculado</Label>
                <Select name="processId" value={selectedProcessId} onValueChange={(val) => setSelectedProcessId(val || "")} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o processo" />
                  </SelectTrigger>
                  <SelectContent>
                    {processos.map(proc => (
                      <SelectItem key={proc.id} value={proc.id}>{proc.number} - {proc.object.substring(0, 30)}...</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Valor Total Estimado (R$)</Label>
              <div className="text-2xl font-bold text-slate-700 h-10 flex items-center">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedTotal)}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="publicationDate">Data de Publicação</Label>
                <Input 
                  id="publicationDate" 
                  name="publicationDate" 
                  type="date" 
                  defaultValue={data?.publicationDate ? format(new Date(data.publicationDate), "yyyy-MM-dd") : ""} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionDate">Prazo da Sessão / Lances</Label>
                <Input 
                  id="sessionDate" 
                  name="sessionDate" 
                  type="datetime-local" 
                  defaultValue={data?.sessionDate ? format(new Date(data.sessionDate), "yyyy-MM-dd'T'HH:mm") : ""} 
                />
                <p className="text-xs text-muted-foreground">No POC, esta data limita os lances enviados pelo portal do fornecedor.</p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t pt-3 sm:flex-row sm:justify-end">
              <Link href="/compras/licitacoes">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
              <Button type="submit" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" /> {isSaving ? "Salvando..." : "Salvar Licitação"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageFrame>
  );
}
