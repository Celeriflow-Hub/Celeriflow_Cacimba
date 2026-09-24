"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetTrigger 
} from "@/components/ui/sheet";
import { createEnvComplaint } from "../actions";

export function NewComplaintSheet() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await createEnvComplaint(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
    }
    setLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<button className="flex h-8 items-center gap-2 rounded-md bg-red-600 px-3 text-sm font-medium text-white transition-colors hover:bg-red-700" />}>
        <AlertTriangle className="h-5 w-5" />
        Registrar Denúncia
      </SheetTrigger>
      <SheetContent side="right" className="w-[calc(100vw-1rem)] overflow-y-auto sm:w-[34rem]">
        <SheetHeader>
          <SheetTitle>Registrar Denúncia Ambiental</SheetTitle>
          <SheetDescription>
            Cadastre uma nova irregularidade ou infração ambiental.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 pb-2">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Denúncia</label>
            <select name="complaintType" className="w-full p-2 border rounded-md" required>
              <option value="">Selecione...</option>
              <option value="Descarte Irregular">Descarte Irregular</option>
              <option value="Poluição Sonora">Poluição Sonora</option>
              <option value="Poluição do Ar / Queimadas">Poluição do Ar / Queimadas</option>
              <option value="Poluição Hídrica">Poluição Hídrica</option>
              <option value="Supressão Vegetal Irregular">Supressão Vegetal Irregular</option>
              <option value="Maus-tratos a Animais">Maus-tratos a Animais</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição da Ocorrência</label>
            <textarea 
              name="description" 
              required 
              className="w-full p-2 border rounded-md" 
              rows={4}
              placeholder="Descreva o que ocorreu de forma detalhada..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Endereço / Localização</label>
            <input 
              name="address" 
              className="w-full p-2 border rounded-md" 
              placeholder="Rua, ponto de referência..."
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              name="isAnonymous" 
              id="isAnonymous"
              value="true"
              defaultChecked
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="isAnonymous" className="text-sm font-medium">
              Manter denúncia anônima
            </label>
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
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Registrando..." : "Registrar Denúncia"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
