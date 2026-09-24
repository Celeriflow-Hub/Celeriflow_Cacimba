"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { addBenefitToEmployee, removeBenefitFromEmployee } from "./benefitActions";
import type { BenefitConfig, Employee, PayrollBenefit } from "@prisma/client";

type EmployeeWithBenefits = Pick<Employee, "id"> & {
  benefits?: (PayrollBenefit & { benefitConfig: BenefitConfig })[];
};

export function EmployeeBenefitsCard({ employee, benefitConfigs }: { employee: EmployeeWithBenefits, benefitConfigs: BenefitConfig[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleAdd = async (formData: FormData) => {
    setIsSaving(true);
    formData.set("employeeId", employee.id);
    const result = await addBenefitToEmployee(formData);
    setIsSaving(false);
    if (result.success) {
      setIsOpen(false);
    } else {
      alert(result.error);
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (confirm(`Remover o benefício ${name}?`)) {
      const result = await removeBenefitFromEmployee(id, employee.id);
      if (!result.success) alert(result.error);
    }
  };

  return (
    <Card size="sm" className="mt-1 rounded-md shadow-none md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Benefícios Concedidos</CardTitle>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 px-3 text-xs">
            <Plus className="mr-2 h-4 w-4" /> Conceder Benefício
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conceder Benefício ao Servidor</DialogTitle>
            </DialogHeader>
            <form action={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label>Benefício</Label>
                <Select name="benefitConfigId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o benefício..." />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    {benefitConfigs.map(bc => (
                      <SelectItem key={bc.id} value={bc.id}>{bc.name} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bc.baseValue)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor Customizado (R$)</Label>
                <Input name="customValue" type="number" step="0.01" placeholder="Opcional. Se vazio, usará o valor base." />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : "Conceder"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </CardHeader>
      <CardContent>
        {employee.benefits && employee.benefits.length > 0 ? (
          <div className="max-h-72 overflow-auto rounded-md border">
            <table className="w-full min-w-[560px] border-collapse text-left text-[11px] [&_td]:px-2.5 [&_td]:py-1.5 [&_th]:px-2.5 [&_th]:py-2">
              <thead className="sticky top-0 z-10 border-b bg-slate-50 text-[10px] uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="p-3 font-medium">Benefício</th>
                  <th className="p-3 font-medium">Tipo</th>
                  <th className="p-3 font-medium">Valor Concedido</th>
                  <th className="p-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {employee.benefits.map((ben) => {
                  const val = ben.customValue !== null ? ben.customValue : ben.benefitConfig.baseValue;
                  return (
                    <tr key={ben.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-3">{ben.benefitConfig.name}</td>
                      <td className="p-3">{ben.benefitConfig.type}</td>
                      <td className="p-3">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)}
                      </td>
                      <td className="p-3 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Remover Benefício"
                          onClick={() => handleRemove(ben.id, ben.benefitConfig.name)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-6 text-muted-foreground border rounded-md border-dashed">
            Nenhum benefício concedido para este servidor.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
