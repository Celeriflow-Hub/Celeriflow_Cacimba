"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetTrigger 
} from "@/components/ui/sheet";
import { createEnvGreenArea } from "../actions";

export function NewGreenAreaSheet() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await createEnvGreenArea(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
    }
    setLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<button className="flex h-8 items-center gap-2 rounded-md bg-green-600 px-3 text-sm font-medium text-white transition-colors hover:bg-green-700" />}>
        <Plus className="h-5 w-5" />
        Nova Área Verde
      </SheetTrigger>
      <SheetContent side="right" className="w-[calc(100vw-1rem)] overflow-y-auto sm:w-[34rem]">
        <SheetHeader>
          <SheetTitle>Cadastrar Área Verde</SheetTitle>
          <SheetDescription>
            Registre uma nova área de conservação, praça ou parque municipal.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 pb-2">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome da Área Verde</label>
            <input 
              name="name" 
              required 
              className="w-full p-2 border rounded-md text-sm" 
              placeholder="Ex: Parque Ecológico das Araucárias"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Área</label>
            <select name="areaType" className="w-full p-2 border rounded-md text-sm" required>
              <option value="">Selecione...</option>
              <option value="Parque Urbano">Parque Urbano</option>
              <option value="Reserva Ecológica">Reserva Ecológica</option>
              <option value="APP (Área de Preservação Permanente)">APP (Área de Preservação Permanente)</option>
              <option value="Praça/Área de Lazer">Praça/Área de Lazer</option>
              <option value="Floresta Municipal">Floresta Municipal</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tamanho da Área (m²)</label>
            <input 
              name="sizeSqm" 
              type="number"
              step="any"
              className="w-full p-2 border rounded-md text-sm" 
              placeholder="Ex: 125000"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Localização / Coordenadas</label>
            <input 
              name="location" 
              className="w-full p-2 border rounded-md text-sm" 
              placeholder="Ex: Av. dos Pinheiros, Centro ou Coordenadas GPS"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status de Conservação</label>
            <select name="status" className="w-full p-2 border rounded-md text-sm">
              <option value="Preservado">Preservado</option>
              <option value="Em Recuperação">Em Recuperação</option>
              <option value="Degradado">Degradado</option>
              <option value="Monitorado">Monitorado</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Observações</label>
            <textarea 
              name="notes" 
              className="w-full p-2 border rounded-md text-sm" 
              rows={3}
              placeholder="Características da flora/fauna, infraestrutura disponível..."
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
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar Área Verde"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
