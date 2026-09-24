"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ClipboardList } from "lucide-react";
import { createAttendance } from "../actions";

export function NewAttendanceSheet({ 
  families, 
  units, 
  professionals 
}: { 
  families: { id: string; representative: { fullName: string } }[],
  units: { id: string; name: string }[],
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
      unitId: formData.get("unitId") as string,
      professionalId: formData.get("professionalId") as string,
      type: formData.get("type") as string,
      description: formData.get("description") as string,
      secrecyLevel: formData.get("secrecyLevel") as string,
    };

    const res = await createAttendance(data);
    setLoading(false);
    if (res.success) {
      setOpen(false);
    } else {
      alert(res.error);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<button className="inline-flex h-7 items-center gap-1 rounded-md bg-emerald-600 px-2.5 text-xs font-semibold text-white hover:bg-emerald-700" />}>
        <ClipboardList className="size-3.5" />
        Novo Atendimento
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Novo Atendimento</SheetTitle>
          <SheetDescription>
            Registre um novo atendimento (PAIF, PAEFI, Acolhimento) para uma família.
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
            <Label htmlFor="unitId">Unidade</Label>
            <select id="unitId" name="unitId" required className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <option value="">Selecione a unidade...</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="type">Tipo de Atendimento</Label>
            <select id="type" name="type" required className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <option value="Acolhimento">Acolhimento</option>
              <option value="PAIF">Acompanhamento PAIF</option>
              <option value="PAEFI">Acompanhamento PAEFI (CREAS)</option>
              <option value="Orientação">Orientação / Informação</option>
              <option value="Encaminhamento">Encaminhamento</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="secrecyLevel">Nível de Sigilo</Label>
            <select id="secrecyLevel" name="secrecyLevel" required className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <option value="Normal">Normal (Visível no Prontuário Geral)</option>
              <option value="Restrito">Restrito (Apenas CREAS / Gestão)</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descrição / Relato do Atendimento</Label>
            <textarea id="description" name="description" rows={5} required className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Descreva os fatos observados, escuta realizada e os acordos/providências..."></textarea>
          </div>
          <Button type="submit" disabled={loading} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
            {loading ? "Registrando..." : "Registrar Atendimento"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
