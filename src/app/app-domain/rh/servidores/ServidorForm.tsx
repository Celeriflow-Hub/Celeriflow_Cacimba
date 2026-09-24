"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { saveServidor } from "./actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Edit, Save, Plus, ArrowLeft } from "lucide-react";
import { EmployeeBenefitsCard } from "./EmployeeBenefitsCard";
import { MoneyInput } from "@/components/ui/MoneyInput";
import type { BenefitConfig, Department, Dependent, Employee, PayrollBenefit, Role, Secretariat } from "@prisma/client";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { ErpPageTitle as PageHeader } from "@/components/app-ui/erp/ErpPageTitle";

// Formata CPF: 000.000.000-00
const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

// Formata Telefone: (00) 00000-0000
const formatPhone = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};

type EmployeeWithRelations = Employee & {
  dependents: Dependent[];
  benefits: (PayrollBenefit & { benefitConfig: BenefitConfig })[];
};

export function ServidorForm({ 
  data, 
  roles = [], 
  departments = [], 
  secretariats = [],
  benefitConfigs = []
}: { 
  data?: EmployeeWithRelations,
  roles?: Role[],
  departments?: Department[],
  secretariats?: Secretariat[],
  benefitConfigs?: BenefitConfig[]
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isActive, setIsActive] = useState(data ? data.isActive : true);

  const [cpf, setCpf] = useState(data?.cpf || "");
  const [phone, setPhone] = useState(data?.phone || "");
  const [salaryBase, setSalaryBase] = useState(data?.salaryBase || 0);

  const [secretariatId, setSecretariatId] = useState<string>(data?.secretariatId || "");
  const [departmentId, setDepartmentId] = useState<string>(data?.departmentId || "");
  const [roleId, setRoleId] = useState<string>(data?.roleId || "");

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    formData.set("isActive", isActive.toString());
    formData.set("cpf", cpf);
    formData.set("phone", phone);
    
    const result = await saveServidor(formData);
    setIsSaving(false);
    
    if (result.success) {
      router.push("/rh/servidores");
    } else {
      alert(result.error);
    }
  }

  return (
    <PageFrame className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-3">
      <PageHeader
        title={data ? "Editar Servidor" : "Novo Servidor"}
        action={<Link href="/rh/servidores">
          <Button variant="outline" size="icon-sm" aria-label="Voltar para servidores">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>}
      />

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-3 md:grid-cols-2">
        <Card size="sm" className="rounded-none border-0 bg-transparent shadow-none md:col-span-2">
          <CardHeader className="border-b pb-2">
            <CardTitle>Dados do Servidor</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <form action={handleSubmit} className="space-y-4">
              {data && <input type="hidden" name="id" value={data.id} />}
              
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo <span className="text-red-500">*</span></Label>
                  <Input id="name" name="name" defaultValue={data?.name || ""} placeholder="Ex: João da Silva" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF <span className="text-red-500">*</span></Label>
                  <Input 
                    id="cpf" 
                    name="cpf" 
                    value={cpf} 
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    placeholder="000.000.000-00" 
                    required 
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="registration">Matrícula</Label>
                  <Input id="registration" name="registration" defaultValue={data?.registration || ""} placeholder="Ex: 12345" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input id="email" name="email" type="email" defaultValue={data?.email || ""} placeholder="email@exemplo.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone <span className="text-red-500">*</span></Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    value={phone} 
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000" 
                    required
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="salaryBase">Salário Base (R$)</Label>
                  <MoneyInput id="salaryBase" name="salaryBase" value={salaryBase} onChange={setSalaryBase} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractedHours">Carga Horária Mensal</Label>
                  <Input id="contractedHours" name="contractedHours" type="number" defaultValue={data?.contractedHours || 220} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="secretariatId">Secretaria</Label>
                  <Select name="secretariatId" value={secretariatId} onValueChange={(v) => setSecretariatId(v || "")}>
                    <SelectTrigger>
                      <span className="flex-1 text-left line-clamp-1">
                        {secretariats.find(s => s.id === secretariatId)?.name || "Selecione..."}
                      </span>
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] z-50">
                      {secretariats.map(sec => (
                        <SelectItem key={sec.id} value={sec.id}>{sec.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departmentId">Departamento / Setor</Label>
                  <Select name="departmentId" value={departmentId} onValueChange={(v) => setDepartmentId(v || "")}>
                    <SelectTrigger>
                      <span className="flex-1 text-left line-clamp-1">
                        {departments.find(d => d.id === departmentId)?.name || "Selecione..."}
                      </span>
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] z-50">
                      {departments.map(dep => (
                        <SelectItem key={dep.id} value={dep.id}>{dep.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roleId">Cargo / Função</Label>
                  <Select name="roleId" value={roleId} onValueChange={(v) => setRoleId(v || "")}>
                    <SelectTrigger>
                      <span className="flex-1 text-left line-clamp-1">
                        {roles.find(r => r.id === roleId)?.name || "Selecione..."}
                      </span>
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] z-50">
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-md border bg-slate-50 p-3">
                <Switch 
                  id="isActive" 
                  checked={isActive} 
                  onCheckedChange={setIsActive} 
                />
                <Label htmlFor="isActive" className="font-semibold cursor-pointer">
                  Servidor Ativo
                </Label>
                <p className="hidden text-sm text-slate-500 sm:ml-2 md:block">
                  Desative esta opção para servidores desligados ou inativos, preservando o histórico.
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <Link href="/rh/servidores">
                  <Button type="button" variant="outline">Cancelar</Button>
                </Link>
                <Button type="submit" disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" /> {isSaving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Cadastro de Dependentes Interno */}
        {data && (
          <Card size="sm" className="mt-1 rounded-md shadow-none md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Dependentes do Servidor</CardTitle>
              <Link href={`/rh/dependentes/novo?employeeId=${data.id}`}>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Novo Dependente
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {data.dependents && data.dependents.length > 0 ? (
                  <div className="max-h-72 overflow-auto rounded-md border">
                  <table className="w-full min-w-[560px] border-collapse text-left text-[11px] [&_td]:px-2.5 [&_td]:py-1.5 [&_th]:px-2.5 [&_th]:py-2">
                    <thead className="sticky top-0 z-10 border-b bg-slate-50 text-[10px] uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <tr>
                        <th className="p-3 font-medium">Nome</th>
                        <th className="p-3 font-medium">Parentesco</th>
                        <th className="p-3 font-medium">Data de Nascimento</th>
                        <th className="p-3 font-medium text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.dependents.map((dep) => (
                        <tr key={dep.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="p-3">{dep.name}</td>
                          <td className="p-3">{dep.relationship}</td>
                          <td className="p-3">{dep.birthDate ? new Date(dep.birthDate).toLocaleDateString('pt-BR') : '-'}</td>
                          <td className="p-3 text-right">
                            <Link href={`/rh/dependentes/${dep.id}/editar`}>
                              <Button variant="ghost" size="sm" title="Editar">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center p-6 text-muted-foreground border rounded-md border-dashed">
                  Nenhum dependente cadastrado para este servidor.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Benefícios Concedidos Interno */}
        {data && <EmployeeBenefitsCard employee={data} benefitConfigs={benefitConfigs} />}
      </div>
      </div>
    </PageFrame>
  );
}
