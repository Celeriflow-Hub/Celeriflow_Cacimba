"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { createFamily } from "../actions";

export function NewFamilySheet({ people }: { people: { id: string; fullName: string }[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      representativeId: formData.get("representativeId") as string,
      nis: formData.get("nis") as string,
      familyCode: formData.get("familyCode") as string,
      income: formData.get("income") ? parseFloat(formData.get("income") as string) : undefined,
      perCapitaIncome: formData.get("perCapitaIncome") ? parseFloat(formData.get("perCapitaIncome") as string) : undefined,
      vulnerabilities: formData.get("vulnerabilities") as string,
    };

    const res = await createFamily(data);
    setLoading(false);
    if (res.success) {
      setOpen(false);
    } else {
      alert(res.error);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors" />}>
        <UserPlus className="h-5 w-5" />
        Nova Família
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nova Família Assistida</SheetTitle>
          <SheetDescription>
            Registre o Cadastro Único e dados socioeconômicos de uma nova família.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="representativeId">Responsável Familiar</Label>
            <select id="representativeId" name="representativeId" required className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <option value="">Selecione a pessoa...</option>
              {people.map(p => (
                <option key={p.id} value={p.id}>{p.fullName}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="nis">NIS do Responsável</Label>
            <Input id="nis" name="nis" placeholder="11 dígitos" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="familyCode">Código Familiar (CadÚnico)</Label>
            <Input id="familyCode" name="familyCode" placeholder="Código de 16 dígitos" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="income">Renda Bruta Familiar</Label>
              <Input id="income" name="income" type="number" step="0.01" placeholder="Ex: 1500.00" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="perCapitaIncome">Renda Per Capita</Label>
              <Input id="perCapitaIncome" name="perCapitaIncome" type="number" step="0.01" placeholder="Ex: 300.00" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="vulnerabilities">Vulnerabilidades Identificadas</Label>
            <textarea id="vulnerabilities" name="vulnerabilities" rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Extrema pobreza, risco alimentar, violação de direitos..."></textarea>
          </div>
          <Button type="submit" disabled={loading} className="mt-4 bg-blue-600 hover:bg-blue-700">
            {loading ? "Salvando..." : "Salvar Família"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
