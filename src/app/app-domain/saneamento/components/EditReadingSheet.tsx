"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { updateMeterReading } from "../actions";

type Reading = {
  id: string;
  competence: string;
  previousValue: number;
  currentValue: number;
  consumption: number;
  readerName: string | null;
  status: string;
  unit: { code: string };
};

export function EditReadingSheet({ reading }: { reading: Reading }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const result = await updateMeterReading(reading.id, {
        currentValue: parseFloat(formData.get("currentValue") as string),
        status: formData.get("status") as string,
        readerName: formData.get("readerName") as string,
      });
      if (result.error) {
        alert(result.error);
        return;
      }
      setOpen(false);
    } catch {
      alert("Erro ao atualizar leitura.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<button className="p-1.5 text-slate-400 hover:text-[#0284C7] hover:bg-blue-50 rounded transition-colors" title="Editar leitura" />}>
        <Pencil className="h-3.5 w-3.5" />
      </SheetTrigger>
      <SheetContent side="right" className="w-[calc(100vw-1rem)] overflow-y-auto sm:w-[34rem]">
        <SheetHeader>
          <SheetTitle>Editar Leitura</SheetTitle>
          <SheetDescription>
            UC <strong>{reading.unit.code}</strong> — Competência: {reading.competence}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 pb-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">Leitura Anterior (somente leitura)</label>
            <input
              value={reading.previousValue}
              disabled
              className="w-full p-2 border rounded-md text-sm bg-gray-50 text-gray-400"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Leitura Atual (m³)</label>
            <input
              type="number"
              name="currentValue"
              step="0.01"
              min="0"
              required
              defaultValue={reading.currentValue}
              className="w-full p-2 border rounded-md text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select name="status" required defaultValue={reading.status} className="w-full p-2 border rounded-md text-sm">
              <option value="Registrada">Registrada</option>
              <option value="Revisada">Revisada</option>
              <option value="Estimada">Estimada</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Leiturista</label>
            <input
              name="readerName"
              defaultValue={reading.readerName ?? ""}
              className="w-full p-2 border rounded-md text-sm"
              placeholder="Nome do leiturista"
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
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
