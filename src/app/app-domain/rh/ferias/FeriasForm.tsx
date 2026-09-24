"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { saveFerias } from "./actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import type { Employee, Vacation } from "@prisma/client";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { ErpPageTitle as PageHeader } from "@/components/app-ui/erp/ErpPageTitle";

export function FeriasForm({ data, employees = [] }: { data?: Vacation, employees?: Employee[] }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [employeeId, setEmployeeId] = useState<string>(data?.employeeId || "");
  const [status, setStatus] = useState<string>(data?.status || "A vencer");

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    const result = await saveFerias(formData);
    setIsSaving(false);
    
    if (result.success) {
      router.push("/rh/ferias");
    } else {
      alert(result.error);
    }
  }

  // Helper to format date for input[type="date"] (YYYY-MM-DD)
  const formatDateForInput = (dateString?: string | Date | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  return (
    <PageFrame className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-3">
      <PageHeader
        title={data ? "Editar Férias" : "Programar Férias"}
        action={<Link href="/rh/ferias">
          <Button variant="outline" size="icon-sm" aria-label="Voltar para férias">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>}
      />

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <Card size="sm" className="rounded-none border-0 bg-transparent shadow-none">
        <CardHeader className="border-b pb-2">
          <CardTitle>Dados de Férias</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <form action={handleSubmit} className="space-y-4">
            {data && <input type="hidden" name="id" value={data.id} />}
            
            <div className="space-y-2">
              <Label htmlFor="employeeId">Servidor</Label>
              <Select name="employeeId" value={employeeId} onValueChange={(v) => setEmployeeId(v || "")} required>
                <SelectTrigger>
                  <span className="flex-1 text-left line-clamp-1">
                    {employeeId ? (
                      (() => {
                        const emp = employees.find(e => e.id === employeeId);
                        return emp ? `${emp.name} (Matrícula: ${emp.registration || "N/A"})` : "Selecione o servidor";
                      })()
                    ) : "Selecione o servidor"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name} (Matrícula: {emp.registration || "N/A"})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 rounded-md border bg-slate-50/50 p-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <h3 className="font-semibold text-slate-700">Período Aquisitivo</h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="acquisitionStart">Data Inicial</Label>
                <Input type="date" id="acquisitionStart" name="acquisitionStart" defaultValue={formatDateForInput(data?.acquisitionStart)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acquisitionEnd">Data Final</Label>
                <Input type="date" id="acquisitionEnd" name="acquisitionEnd" defaultValue={formatDateForInput(data?.acquisitionEnd)} required />
              </div>
            </div>

            <div className="grid gap-3 rounded-md border bg-slate-50/50 p-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <h3 className="font-semibold text-slate-700">Período de Gozo (Opcional)</h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="enjoymentStart">Início do Gozo</Label>
                <Input type="date" id="enjoymentStart" name="enjoymentStart" defaultValue={formatDateForInput(data?.enjoymentStart)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enjoymentEnd">Fim do Gozo</Label>
                <Input type="date" id="enjoymentEnd" name="enjoymentEnd" defaultValue={formatDateForInput(data?.enjoymentEnd)} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="days">Dias de Férias</Label>
                <Input type="number" id="days" name="days" defaultValue={data?.days || 30} min="1" max="30" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" value={status} onValueChange={(v) => setStatus(v || "A vencer")}>
                  <SelectTrigger>
                    <span className="flex-1 text-left line-clamp-1">{status}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A vencer">A vencer</SelectItem>
                    <SelectItem value="Disponível">Disponível</SelectItem>
                    <SelectItem value="Programada">Programada</SelectItem>
                    <SelectItem value="Em gozo">Em gozo</SelectItem>
                    <SelectItem value="Concluída">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Link href="/rh/ferias">
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
