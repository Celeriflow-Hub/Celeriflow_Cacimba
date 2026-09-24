"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { savePonto } from "./actions";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import type { AttendanceRecord, Employee } from "@prisma/client";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { ErpPageTitle as PageHeader } from "@/components/app-ui/erp/ErpPageTitle";

export function PontoForm({ data, employees = [] }: { data?: AttendanceRecord, employees?: Employee[] }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [entryTime, setEntryTime] = useState(data?.entryTime ? new Date(data.entryTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "");
  const [exitTime, setExitTime] = useState(data?.exitTime ? new Date(data.exitTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "");
  const [employeeId, setEmployeeId] = useState<string>(data?.employeeId || "");
  const [status, setStatus] = useState<string>(data?.status || "Presente");

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    formData.set("entryTime", entryTime);
    formData.set("exitTime", exitTime);
    const result = await savePonto(formData);
    setIsSaving(false);
    
    if (result.success) {
      router.push("/rh/ponto");
    } else {
      alert(result.error);
    }
  }

  // Helper to format date for input[type="date"] (YYYY-MM-DD)
  const formatDateForInput = (dateString?: string | Date) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const calculatedHours = useMemo(() => {
    if (entryTime && exitTime) {
      const [eh, em] = entryTime.split(":").map(Number);
      const [xh, xm] = exitTime.split(":").map(Number);
      let diff = (xh * 60 + xm) - (eh * 60 + em);
      if (diff < 0) diff += 24 * 60; // crossed midnight
      return (diff / 60).toFixed(2);
    }
    return "0.00";
  }, [entryTime, exitTime]);

  return (
    <PageFrame className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-3">
      <PageHeader
        title={data ? "Editar Ponto" : "Registrar Ponto"}
        action={<Link href="/rh/ponto">
          <Button variant="outline" size="icon-sm" aria-label="Voltar para registro de ponto">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>}
      />

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <Card size="sm" className="rounded-none border-0 bg-transparent shadow-none">
        <CardHeader className="border-b pb-2">
          <CardTitle>Registro Diário de Ponto</CardTitle>
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
                <Label htmlFor="date">Data do Registro</Label>
                <Input type="date" id="date" name="date" defaultValue={formatDateForInput(data?.date || new Date())} required />
              </div>
            </div>

            <div className="grid gap-3 rounded-md border bg-slate-50/50 p-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="entryTime">Hora de Entrada</Label>
                <Input type="time" id="entryTime" value={entryTime} onChange={(e) => setEntryTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exitTime">Hora de Saída</Label>
                <Input type="time" id="exitTime" value={exitTime} onChange={(e) => setExitTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Horas Trabalhadas (Calculadas)</Label>
                <div className="text-2xl font-bold text-slate-700 h-10 flex items-center">
                  {calculatedHours}h
                </div>
              </div>
            </div>

            <div className="space-y-2 max-w-sm">
              <Label htmlFor="status">Status</Label>
              <Select name="status" value={status} onValueChange={(v) => setStatus(v || "Presente")}>
                <SelectTrigger>
                  <span className="flex-1 text-left line-clamp-1">{status}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Presente">Presente</SelectItem>
                  <SelectItem value="Falta">Falta</SelectItem>
                  <SelectItem value="Atraso">Atraso</SelectItem>
                  <SelectItem value="Férias">Férias</SelectItem>
                  <SelectItem value="Licença">Licença</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Link href="/rh/ponto">
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
