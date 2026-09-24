"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveContract } from "./actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { calculateInclusiveContractTermDays, parseContractDate } from "@/lib/compras/contract-lifecycle";

type ContractData = {
  id: string;
  processId: string;
  supplierId: string;
  secretariatId: string;
  sourceBudgetUnitId?: string | null;
  number: string;
  object: string;
  initialValue: number;
  updatedValue: number;
  status: string;
  startDate: Date;
  endDate: Date;
};

type ProcessOption = {
  id: string;
  number: string;
  object: string;
  estimatedValue: number | null;
  items: Array<{ quantity: number }>;
};

type SecretariatOption = { id: string; name: string };
type BudgetUnitOption = { id: string; code: string; name: string; secretariatId: string };

type SupplierOption = {
  id: string;
  company: { corporateName: string; tradeName: string | null } | null;
  person: { fullName: string } | null;
};

type ContratoFormProps = {
  data?: ContractData;
  processos?: ProcessOption[];
  secretarias?: SecretariatOption[];
  unidadesGestoras?: BudgetUnitOption[];
  fornecedores?: SupplierOption[];
};

const directlyEditableStatuses = ["Minuta", "Vigente", "Encerrado"];

export function ContratoForm({ data, processos = [], secretarias = [], unidadesGestoras = [], fornecedores = [] }: ContratoFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState<string>(data?.processId || "");
  const dateValue = (value?: Date) => value ? new Date(value).toISOString().slice(0, 10) : "";
  const [startDate, setStartDate] = useState(() => dateValue(data?.startDate));
  const [endDate, setEndDate] = useState(() => dateValue(data?.endDate));

  const selectedProcess = processos.find(p => p.id === selectedProcessId);
  const calculatedTotal = data?.initialValue ?? selectedProcess?.estimatedValue ?? 0;
  const contractedQuantity = selectedProcess?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;
  const parsedStartDate = parseContractDate(startDate);
  const parsedEndDate = parseContractDate(endDate);
  const statusLocked = Boolean(data && !directlyEditableStatuses.includes(data.status));
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
    formData.set("initialValue", calculatedTotal.toString());
    const result = await saveContract(formData);
    setIsSaving(false);
    
    if (result.success) {
      router.push("/compras/contratos");
    } else {
      alert(result.error);
    }
  }

  return (
    <PageFrame className="space-y-2">
      <PageHeader title={data ? "Editar Contrato" : "Novo Contrato"} action={<Link href="/compras/contratos" aria-label="Voltar"><Button variant="outline" size="icon"><ArrowLeft className="size-4" /></Button></Link>} />

      <Card className="max-w-5xl rounded-md">
        <CardHeader className="border-b p-3">
          <CardTitle className="text-sm">Dados do Contrato Administrativo</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <form action={handleSubmit} className="space-y-4">
            {data && <input type="hidden" name="id" value={data.id} />}
            
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="number">Número do Contrato</Label>
                <Input id="number" name="number" defaultValue={data?.number || ""} placeholder="Ex: CONT 001/2026" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="processId">Processo Vinculado</Label>
                {data && <input type="hidden" name="processId" value={data.processId} />}
                <Select name="processId" value={selectedProcessId} onValueChange={(val) => setSelectedProcessId(val || "")} required disabled={Boolean(data)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o processo" />
                  </SelectTrigger>
                  <SelectContent>
                    {processos.map(proc => (
                      <SelectItem key={proc.id} value={proc.id}>{proc.number} - {proc.object?.substring(0, 30)}...</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProcess && <p className="text-xs text-muted-foreground">Quantidade vinculada ao processo: {new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 }).format(contractedQuantity)}</p>}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="startDate">Início da vigência</Label>
                <Input id="startDate" name="startDate" type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} disabled={Boolean(data)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Fim da vigência</Label>
                <Input id="endDate" name="endDate" type="date" required value={endDate} onChange={(event) => setEndDate(event.target.value)} disabled={Boolean(data)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Situação</Label>
                {statusLocked && data && <input type="hidden" name="status" value={data.status} />}
                <Select name="status" defaultValue={data?.status || "Minuta"} required disabled={statusLocked}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Minuta">Minuta</SelectItem>
                    <SelectItem value="Vigente">Vigente</SelectItem>
                    <SelectItem value="Encerrado">Encerrado</SelectItem>
                    {statusLocked && data && <SelectItem value={data.status}>{data.status}</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">Vigência calculada: {termDays ? `${termDays} dia${termDays === 1 ? "" : "s"} corrido${termDays === 1 ? "" : "s"}, com contagem inclusiva.` : "Informe datas válidas de início e término."}{data && " Valor inicial e vigência são preservados nesta edição; registre alteração por aditivo."}</p>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="supplierId">Fornecedor</Label>
                <Select name="supplierId" defaultValue={data?.supplierId || ""} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map(forn => (
                      <SelectItem key={forn.id} value={forn.id}>{forn.company?.corporateName || forn.company?.tradeName || forn.person?.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secretariatId">Secretaria</Label>
                {data && <input type="hidden" name="secretariatId" value={data.secretariatId} />}
                <Select name="secretariatId" defaultValue={data?.secretariatId || ""} required disabled={Boolean(data)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a Secretaria" />
                  </SelectTrigger>
                  <SelectContent>
                    {secretarias.map(sec => (
                      <SelectItem key={sec.id} value={sec.id}>{sec.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sourceBudgetUnitId">Unidade Gestora de origem</Label>
                <Select name="sourceBudgetUnitId" defaultValue={data?.sourceBudgetUnitId || ""} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a Unidade Gestora" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidadesGestoras.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>{unit.code} - {unit.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Valor Inicial (R$)</Label>
              <div className="text-2xl font-bold text-slate-700 h-10 flex items-center">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedTotal)}
              </div>
              <input type="hidden" name="initialValue" value={calculatedTotal} />
              {data && <p className="text-xs text-muted-foreground">Valor atualizado: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.updatedValue)}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="object">Objeto do Contrato</Label>
              <Textarea id="object" name="object" defaultValue={data?.object || ""} required rows={4} />
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Link href="/compras/contratos">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
              <Button type="submit" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" /> {isSaving ? "Salvando..." : "Salvar Contrato"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageFrame>
  );
}
