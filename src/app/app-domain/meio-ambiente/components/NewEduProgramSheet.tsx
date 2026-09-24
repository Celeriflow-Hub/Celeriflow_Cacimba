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
import { createEnvEduProgram } from "../actions";

export function NewEduProgramSheet() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await createEnvEduProgram(formData);

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
        Novo Projeto / Ação
      </SheetTrigger>
      <SheetContent side="right" className="w-[calc(100vw-1rem)] overflow-y-auto sm:w-[34rem]">
        <SheetHeader>
          <SheetTitle>Cadastrar Ação de Educação Ambiental</SheetTitle>
          <SheetDescription>
            Planeje ou registre novas ações educativas, oficinas ou palestras sustentáveis.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 pb-2">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Título da Campanha/Ação</label>
            <input 
              name="title" 
              required 
              className="w-full p-2 border rounded-md text-sm" 
              placeholder="Ex: Campanha Coleta Seletiva Bairro Verde"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição / Conteúdo</label>
            <textarea 
              name="description" 
              required
              className="w-full p-2 border rounded-md text-sm" 
              rows={3}
              placeholder="Ex: Oficinas comunitárias de compostagem e reciclagem de materiais..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Público-Alvo</label>
            <input 
              name="targetAudience" 
              className="w-full p-2 border rounded-md text-sm" 
              placeholder="Ex: Escolas Municipais, Moradores, Comerciantes..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Início</label>
              <input 
                name="startDate" 
                type="date"
                required
                className="w-full p-2 border rounded-md text-sm" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Fim (Opcional)</label>
              <input 
                name="endDate" 
                type="date"
                className="w-full p-2 border rounded-md text-sm" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nº de Participantes</label>
            <input 
              name="participantsCount" 
              type="number"
              className="w-full p-2 border rounded-md text-sm" 
              placeholder="Ex: 150"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status do Projeto</label>
            <select name="status" className="w-full p-2 border rounded-md text-sm">
              <option value="Planejado">Planejado</option>
              <option value="Em Execução">Em Execução</option>
              <option value="Concluído">Concluído</option>
              <option value="Cancelado">Cancelado</option>
            </select>
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
              {loading ? "Salvando..." : "Salvar Projeto"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
