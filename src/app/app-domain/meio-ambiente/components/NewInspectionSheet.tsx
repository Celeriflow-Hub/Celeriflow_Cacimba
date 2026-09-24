"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetTrigger 
} from "@/components/ui/sheet";
import { createEnvInspection } from "../actions";

export function NewInspectionSheet({ enterprises }: { enterprises: { id: string, name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await createEnvInspection(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
    }
    setLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<button className="flex h-8 items-center gap-2 rounded-md bg-purple-600 px-3 text-sm font-medium text-white transition-colors hover:bg-purple-700" />}>
        <Search className="h-5 w-5" />
        Agendar Vistoria
      </SheetTrigger>
      <SheetContent side="right" className="w-[calc(100vw-1rem)] overflow-y-auto sm:w-[34rem]">
        <SheetHeader>
          <SheetTitle>Agendar Nova Vistoria</SheetTitle>
          <SheetDescription>
            Agende uma fiscalização para um empreendimento ou local.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 pb-2">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Agendada</label>
            <input 
              type="datetime-local"
              name="dateScheduled" 
              required 
              className="w-full p-2 border rounded-md" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Fiscal Responsável</label>
            <input 
              name="inspector" 
              required 
              className="w-full p-2 border rounded-md" 
              placeholder="Nome do fiscal..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Empreendimento Vinculado (Opcional)</label>
            <select name="enterpriseId" className="w-full p-2 border rounded-md">
              <option value="">Não vinculado a um empreendimento</option>
              {enterprises.map((ent) => (
                <option key={ent.id} value={ent.id}>{ent.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Observações / Motivo da Vistoria</label>
            <textarea 
              name="notes" 
              className="w-full p-2 border rounded-md" 
              rows={4}
              placeholder="Ex: Vistoria de rotina, verificação de denúncia..."
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
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Agendar Vistoria"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
