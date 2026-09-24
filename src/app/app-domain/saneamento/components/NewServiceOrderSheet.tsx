"use client";

import { useState } from "react";
import { Wrench } from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetTrigger 
} from "@/components/ui/sheet";
import { createServiceOrder } from "../actions";

export function NewServiceOrderSheet({ units }: { units: { id: string; code: string; address: string }[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await createServiceOrder({
        orderType: formData.get("orderType") as string,
        description: formData.get("description") as string,
        priority: formData.get("priority") as string,
        unitId: formData.get("unitId") as string,
        technician: formData.get("technician") as string,
      });
      if (result.error) {
        alert(result.error);
        return;
      }
      setOpen(false);
    } catch {
      alert("Erro ao abrir ordem de serviço.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<button className="flex h-8 items-center gap-2 rounded-md bg-[#0284C7] px-3 text-sm font-medium text-white transition-colors hover:bg-[#0369A1]" />}>
        <Wrench className="h-5 w-5" />
        Nova OS
      </SheetTrigger>
      <SheetContent side="right" className="w-[calc(100vw-1rem)] overflow-y-auto sm:w-[34rem]">
        <SheetHeader>
          <SheetTitle>Abrir Ordem de Serviço</SheetTitle>
          <SheetDescription>
            Registre um chamado técnico (Vazamento, religação, etc).
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 pb-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Serviço</label>
            <select name="orderType" required className="w-full p-2 border rounded-md">
              <option value="Vazamento">Vazamento na Rede</option>
              <option value="Religação">Religação de Água</option>
              <option value="Corte">Corte por Inadimplência</option>
              <option value="Manutenção">Manutenção Preventiva</option>
              <option value="Troca de Hidrômetro">Troca de Hidrômetro</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Unidade Consumidora (Opcional)</label>
            <select name="unitId" className="w-full p-2 border rounded-md">
              <option value="">Serviço na rede pública (sem unidade)</option>
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.code} - {unit.address}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Prioridade</label>
            <select name="priority" required className="w-full p-2 border rounded-md">
              <option value="Normal">Normal</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição do Problema</label>
            <textarea
              name="description"
              required
              rows={4}
              className="w-full p-2 border rounded-md"
              placeholder="Descreva o serviço necessário..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Técnico Responsável</label>
            <input
              name="technician"
              className="w-full p-2 border rounded-md"
              placeholder="Nome do técnico"
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0284C7] rounded-md hover:bg-[#0369A1] disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Abrir Ordem"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
