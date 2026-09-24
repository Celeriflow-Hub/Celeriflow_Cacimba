"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveLicenca } from "./actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import type { Employee, Leave } from "@prisma/client";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { ErpPageTitle as PageHeader } from "@/components/app-ui/erp/ErpPageTitle";

type LeaveFormData = Leave;

export function LicencaForm({ data, employees = [] }: { data?: LeaveFormData, employees?: Employee[] }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [employeeId, setEmployeeId] = useState<string>(data?.employeeId || "");
  const [type, setType] = useState<string>(data?.type || "Médica");
  const [status, setStatus] = useState<string>(data?.status || "Ativa");

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    const result = await saveLicenca(formData);
    setIsSaving(false);
    
    if (result.success) {
      router.push("/rh/licencas");
    } else {
      alert(result.error);
    }
  }

  const formatDateForInput = (dateString?: string | Date) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  return (
    <PageFrame className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-3">
      <PageHeader
        title={data ? "Editar Licença" : "Registrar Licença/Afastamento"}
        action={<Link href="/rh/licencas">
          <Button variant="outline" size="icon-sm" aria-label="Voltar para licenças">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>}
      />

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <Card size="sm" className="rounded-none border-0 bg-transparent shadow-none">
        <CardHeader className="border-b pb-2">
          <CardTitle>Dados da Licença</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <form action={handleSubmit} className="space-y-4">
            {data && <input type="hidden" name="id" value={data.id} />}
            
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Servidor</Label>
                <Select name="employeeId" value={employeeId} onValueChange={(v) => setEmployeeId(v || "")} required>
                  <SelectTrigger>
                    <span className="flex-1 text-left line-clamp-1">
                      {employeeId ? (employees.find(e => e.id === employeeId)?.name || "Selecione o servidor") : "Selecione o servidor"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Licença</Label>
                <Select name="type" value={type} onValueChange={(v) => setType(v || "Médica")} required>
                  <SelectTrigger>
                    <span className="flex-1 text-left line-clamp-1">{type}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Médica">Médica / Saúde</SelectItem>
                    <SelectItem value="Maternidade">Maternidade</SelectItem>
                    <SelectItem value="Paternidade">Paternidade</SelectItem>
                    <SelectItem value="Sem Vencimento">Sem Vencimento</SelectItem>
                    <SelectItem value="Prêmio">Prêmio</SelectItem>
                    <SelectItem value="Estudo">Para Estudo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início</Label>
                <Input type="date" id="startDate" name="startDate" defaultValue={formatDateForInput(data?.startDate)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data de Término</Label>
                <Input type="date" id="endDate" name="endDate" defaultValue={formatDateForInput(data?.endDate)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" value={status} onValueChange={(v) => setStatus(v || "Ativa")}>
                  <SelectTrigger>
                    <span className="flex-1 text-left line-clamp-1">{status}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativa">Ativa</SelectItem>
                    <SelectItem value="Encerrada">Encerrada</SelectItem>
                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo / observações internas</Label>
              <Textarea 
                id="reason" 
                name="reason" 
                defaultValue={data?.reason || ""} 
                placeholder="Observações funcionais e referência do ato, quando aplicável."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Link href="/rh/licencas">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
              <Button type="submit" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" /> {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </PageFrame>
  );
}

