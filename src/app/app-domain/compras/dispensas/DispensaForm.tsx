"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveDispensa } from "./actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

type DirectContractingData = {
  id: string;
  processId: string;
  supplierId: string | null;
  type: string;
  status: string;
  justification: string;
};

type ProcessOption = {
  id: string;
  number: string;
  object: string;
  estimatedValue: number | null;
};

type SupplierOption = {
  id: string;
  company: { corporateName: string; tradeName: string | null } | null;
};

type DispensaFormProps = {
  data?: DirectContractingData;
  processos?: ProcessOption[];
  fornecedores?: SupplierOption[];
};

export function DispensaForm({ data, processos = [], fornecedores = [] }: DispensaFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState<string>(data?.processId || "");

  const selectedProcess = processos.find(p => p.id === selectedProcessId);
  const calculatedTotal = selectedProcess?.estimatedValue ?? 0;

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    formData.set("value", calculatedTotal.toString());
    const result = await saveDispensa(formData);
    setIsSaving(false);
    
    if (result.success) {
      router.push("/compras/licitacoes");
    } else {
      alert(result.error);
    }
  }

  return (
    <PageFrame className="space-y-2">
      <PageHeader title={data ? "Editar Contratação Direta" : "Nova Contratação Direta"} action={<Link href="/compras/licitacoes" aria-label="Voltar"><Button variant="outline" size="icon"><ArrowLeft className="size-4" /></Button></Link>} />

      <Card className="max-w-4xl rounded-md">
        <CardHeader className="border-b p-3">
          <CardTitle className="text-sm">Dados da Dispensa/Inexigibilidade</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <form action={handleSubmit} className="space-y-4">
            {data && <input type="hidden" name="id" value={data.id} />}
            
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select name="type" defaultValue={data?.type || "Dispensa"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dispensa">Dispensa de Licitação</SelectItem>
                    <SelectItem value="Inexigibilidade">Inexigibilidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={data?.status || "Em Elaboração"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Em Elaboração">Em Elaboração</SelectItem>
                    <SelectItem value="Publicada">Publicada</SelectItem>
                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                    <SelectItem value="Concluída">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="processId">Processo Vinculado</Label>
                <Select name="processId" value={selectedProcessId} onValueChange={(val) => setSelectedProcessId(val || "")} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o processo" />
                  </SelectTrigger>
                  <SelectContent>
                    {processos.map(proc => (
                      <SelectItem key={proc.id} value={proc.id}>{proc.number} - {proc.object?.substring(0, 30)}...</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplierId">Fornecedor</Label>
                <Select name="supplierId" defaultValue={data?.supplierId || ""} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map(forn => (
                      <SelectItem key={forn.id} value={forn.id}>{forn.company?.corporateName || forn.company?.tradeName}</SelectItem>
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
              <input type="hidden" name="value" value={calculatedTotal} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="justification">Justificativa Legal</Label>
              <Textarea 
                id="justification" 
                name="justification" 
                defaultValue={data?.justification || ""} 
                placeholder="Fundamentação legal para a dispensa ou inexigibilidade"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Link href="/compras/licitacoes">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
              <Button type="submit" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" /> {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageFrame>
  );
}
