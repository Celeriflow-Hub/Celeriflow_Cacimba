"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { saveBeneficio } from "./actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { MoneyInput } from "@/components/ui/MoneyInput";
import type { BenefitConfig, Company, Person, Supplier } from "@prisma/client";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { ErpPageTitle as PageHeader } from "@/components/app-ui/erp/ErpPageTitle";

type SupplierWithIdentity = Supplier & { company: Company | null; person: Person | null };

export function BeneficioForm({ data, suppliers = [] }: { data?: BenefitConfig, suppliers?: SupplierWithIdentity[] }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isActive, setIsActive] = useState(data ? data.isActive : true);
  const [baseValue, setBaseValue] = useState(data?.baseValue || 0);
  const [supplierId, setSupplierId] = useState<string>(data?.supplierId || "none");

  const getSupplierName = (sup: SupplierWithIdentity | undefined) => {
    if (!sup) return "Sem Nome";
    if (sup.company) return sup.company.corporateName || sup.company.tradeName || "Empresa Sem Nome";
    if (sup.person) return sup.person.fullName || "Pessoa Sem Nome";
    return "Sem Nome";
  };

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    formData.set("isActive", isActive.toString());
    const result = await saveBeneficio(formData);
    setIsSaving(false);
    
    if (result.success) {
      router.push("/rh/beneficios");
    } else {
      alert(result.error);
    }
  }

  return (
    <PageFrame className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-3">
      <PageHeader
        title={data ? "Editar Benefício" : "Novo Benefício"}
        action={<Link href="/rh/beneficios">
          <Button variant="outline" size="icon-sm" aria-label="Voltar para benefícios">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>}
      />

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <Card size="sm" className="rounded-none border-0 bg-transparent shadow-none">
        <CardHeader className="border-b pb-2">
          <CardTitle>Configuração do Benefício</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <form action={handleSubmit} className="space-y-4">
            {data && <input type="hidden" name="id" value={data.id} />}
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Benefício <span className="text-red-500">*</span></Label>
              <Input id="name" name="name" defaultValue={data?.name || ""} placeholder="Ex: Vale Refeição Ticket" required />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Categoria / Tipo <span className="text-red-500">*</span></Label>
                <Select name="type" defaultValue={data?.type || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vale Refeição">Vale Refeição</SelectItem>
                    <SelectItem value="Vale Alimentação">Vale Alimentação</SelectItem>
                    <SelectItem value="Vale Transporte">Vale Transporte</SelectItem>
                    <SelectItem value="Plano de Saúde">Plano de Saúde</SelectItem>
                    <SelectItem value="Plano Odontológico">Plano Odontológico</SelectItem>
                    <SelectItem value="Auxílio Creche">Auxílio Creche</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseValue">Valor Base (R$) <span className="text-red-500">*</span></Label>
                <MoneyInput 
                  id="baseValue" 
                  name="baseValue" 
                  value={baseValue}
                  onChange={setBaseValue}
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierId">Fornecedor / Operadora</Label>
              <Select name="supplierId" value={supplierId} onValueChange={(v) => setSupplierId(v || "none")}>
                <SelectTrigger>
                  <span className="flex-1 text-left line-clamp-1">
                    {supplierId === "none" || !supplierId
                      ? "Nenhum (Gerido internamente)"
                      : getSupplierName(suppliers.find(s => s.id === supplierId))}
                  </span>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="none">Nenhum (Gerido internamente)</SelectItem>
                  {suppliers.map(sup => (
                    <SelectItem key={sup.id} value={sup.id}>{getSupplierName(sup)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 rounded-md border bg-slate-50 p-3">
              <Switch 
                id="isActive" 
                checked={isActive} 
                onCheckedChange={setIsActive} 
              />
              <Label htmlFor="isActive" className="font-semibold cursor-pointer">
                Benefício Ativo
              </Label>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Link href="/rh/beneficios">
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
