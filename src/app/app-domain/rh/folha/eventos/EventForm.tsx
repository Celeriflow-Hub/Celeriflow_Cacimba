"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { saveEvent } from "./actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import type { PayrollEvent } from "@prisma/client";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { ErpPageTitle as PageHeader } from "@/components/app-ui/erp/ErpPageTitle";

export function EventForm({ data }: { data?: PayrollEvent }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isActive, setIsActive] = useState(data ? data.isActive : true);
  const [type, setType] = useState<string>(data?.type || "Vencimento");

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    formData.set("isActive", isActive.toString());
    const result = await saveEvent(formData);
    setIsSaving(false);
    
    if (result.success) {
      router.push("/rh/folha/eventos");
    } else {
      alert(result.error);
    }
  }

  return (
    <PageFrame className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-3">
      <PageHeader
        title={data ? "Editar Evento" : "Novo Evento"}
        action={<Link href="/rh/folha/eventos">
          <Button variant="outline" size="icon-sm" aria-label="Voltar para eventos da folha">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>}
      />

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <Card size="sm" className="rounded-none border-0 bg-transparent shadow-none">
        <CardHeader className="border-b pb-2">
          <CardTitle>Configuração do Evento / Rubrica</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <form action={handleSubmit} className="space-y-4">
            {data && <input type="hidden" name="id" value={data.id} />}
            
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Código <span className="text-red-500">*</span></Label>
                <Input id="code" name="code" defaultValue={data?.code || ""} placeholder="Ex: 001" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo do Evento <span className="text-red-500">*</span></Label>
                <Select name="type" value={type} onValueChange={(v) => setType(v || "Vencimento")}>
                  <SelectTrigger>
                    <span className="flex-1 text-left line-clamp-1">
                      {type === "Vencimento" ? "Vencimento (Provento)" : type === "Desconto" ? "Desconto" : "Base de Cálculo"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vencimento">Vencimento (Provento)</SelectItem>
                    <SelectItem value="Desconto">Desconto</SelectItem>
                    <SelectItem value="Base">Base de Cálculo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome / Descrição <span className="text-red-500">*</span></Label>
              <Input id="name" name="name" defaultValue={data?.name || ""} placeholder="Ex: Salário Base" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="formula">Fórmula (Opcional)</Label>
              <Input id="formula" name="formula" defaultValue={data?.formula || ""} placeholder="Ex: SALARIO_BASE * 1.0" />
              <p className="text-xs text-muted-foreground">
                Deixe em branco para valor manual ou variável mensal.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-md border bg-slate-50 p-3">
              <Switch 
                id="isActive" 
                checked={isActive} 
                onCheckedChange={setIsActive} 
              />
              <Label htmlFor="isActive" className="font-semibold cursor-pointer">
                Evento Ativo
              </Label>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Link href="/rh/folha/eventos">
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
