"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package } from "lucide-react";
import { createBenefitConcession } from "../actions";

export function NewBenefitConcessionSheet({ 
  families, 
  benefits, 
  professionals 
}: { 
  families: { id: string; representative: { fullName: string } }[],
  benefits: { id: string; name: string }[],
  professionals: { id: string; name: string }[]
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      familyId: formData.get("familyId") as string,
      benefitId: formData.get("benefitId") as string,
      professionalId: formData.get("professionalId") as string,
      quantity: formData.get("quantity") ? parseInt(formData.get("quantity") as string) : 1,
      value: formData.get("value") ? parseFloat(formData.get("value") as string) : undefined,
    };

    const res = await createBenefitConcession(data);
    setLoading(false);
    if (res.success) {
      setOpen(false);
    } else {
      alert(res.error);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<button className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors" />}>
        <Package className="h-5 w-5" />
        Conceder Benefício
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Concessão de Benefício Eventual</SheetTitle>
          <SheetDescription>
            Registre a entrega de cestas básicas, auxílios e outros benefícios.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="familyId">Família</Label>
            <select id="familyId" name="familyId" required className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <option value="">Selecione a família...</option>
              {families.map(f => (
                <option key={f.id} value={f.id}>{f.representative.fullName}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="benefitId">Benefício</Label>
            <select id="benefitId" name="benefitId" required className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <option value="">Selecione o benefício...</option>
              {benefits.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="professionalId">Técnico/Profissional</Label>
            <select id="professionalId" name="professionalId" required className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <option value="">Selecione o técnico...</option>
              {professionals.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input id="quantity" name="quantity" type="number" defaultValue={1} min={1} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="value">Valor Financeiro (R$)</Label>
              <Input id="value" name="value" type="number" step="0.01" placeholder="Se aplicável..." />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="mt-4 bg-amber-600 hover:bg-amber-700">
            {loading ? "Registrando..." : "Registrar Concessão"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
