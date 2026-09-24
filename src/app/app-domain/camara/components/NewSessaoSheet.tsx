"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetTrigger 
} from "@/components/ui/sheet";
import { createSessao } from "../actions";

export function NewSessaoSheet() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await createSessao({
        numero: parseInt(formData.get("numero") as string),
        tipo: formData.get("tipo") as string,
        data: new Date(formData.get("data") as string),
        local: formData.get("local") as string,
      });
      setOpen(false);
    } catch (error) {
      console.error(error);
      alert("Erro ao agendar sessão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<button className="flex items-center gap-2 bg-[#9333EA] hover:bg-[#7E22CE] text-white px-4 py-2 rounded-lg font-medium transition-colors" />}>
        <CalendarPlus className="h-5 w-5" />
        Nova Sessão
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Agendar Sessão</SheetTitle>
          <SheetDescription>
            Registre uma nova sessão plenária ou reunião.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Número da Sessão</label>
            <input
              type="number"
              name="numero"
              required
              className="w-full p-2 border rounded-md"
              placeholder="Ex: 42"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Sessão</label>
            <select name="tipo" required className="w-full p-2 border rounded-md">
              <option value="Ordinária">Ordinária</option>
              <option value="Extraordinária">Extraordinária</option>
              <option value="Solene">Solene</option>
              <option value="Especial">Especial</option>
              <option value="Audiência Pública">Audiência Pública</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Data e Hora</label>
            <input
              type="datetime-local"
              name="data"
              required
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Local</label>
            <input
              name="local"
              required
              defaultValue="Plenário"
              className="w-full p-2 border rounded-md"
              placeholder="Ex: Plenário, Câmara, Itinerante..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
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
              className="px-4 py-2 text-sm font-medium text-white bg-[#9333EA] rounded-md hover:bg-[#7E22CE] disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar Sessão"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
