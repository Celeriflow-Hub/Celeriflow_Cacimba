"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { saveAtoPessoal } from "./actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { FileUpload } from "@/components/ui/FileUpload";
import type { Employee, PersonnelAct } from "@prisma/client";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { ErpPageTitle as PageHeader } from "@/components/app-ui/erp/ErpPageTitle";

export function AtoForm({ data, employees = [] }: { data?: PersonnelAct, employees?: Employee[] }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [employeeId, setEmployeeId] = useState<string>(data?.employeeId || "");
  const [type, setType] = useState<string>(data?.type || "");

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    const result = await saveAtoPessoal(formData);
    setIsSaving(false);
    
    if (result.success) {
      router.push("/rh/atos");
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
        title={data ? "Editar Ato de Pessoal" : "Registrar Ato de Pessoal"}
        action={<Link href="/rh/atos">
          <Button variant="outline" size="icon-sm" aria-label="Voltar para atos de pessoal">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>}
      />

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <Card size="sm" className="rounded-none border-0 bg-transparent shadow-none">
        <CardHeader className="border-b pb-2">
          <CardTitle>Detalhes do Ato</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <form action={handleSubmit} className="space-y-4">
            {data && <input type="hidden" name="id" value={data.id} />}
            
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

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo do Ato</Label>
                <Select name="type" value={type} onValueChange={(v) => setType(v || "")} required>
                  <SelectTrigger>
                    <span className="flex-1 text-left line-clamp-1">
                      {type || "Selecione o tipo de ato"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admissão">Admissão</SelectItem>
                    <SelectItem value="Demissão">Demissão</SelectItem>
                    <SelectItem value="Promoção">Promoção / Progressão</SelectItem>
                    <SelectItem value="Transferência">Transferência / Lotação</SelectItem>
                    <SelectItem value="Advertência">Advertência / Suspensão</SelectItem>
                    <SelectItem value="Elogio">Elogio</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Data do Ato</Label>
                <Input type="date" id="date" name="date" defaultValue={formatDateForInput(data?.date || new Date())} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="actNumber">Número do Ato (Portaria/Diário Oficial)</Label>
              <Input 
                id="actNumber" 
                name="actNumber" 
                defaultValue={data?.actNumber || ""} 
                placeholder="Ex: Portaria nº 123/2026"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentUrl">Documento Comprobatório (Opcional)</Label>
              <FileUpload name="documentUrl" defaultValue={data?.documentUrl} />
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Link href="/rh/atos">
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
