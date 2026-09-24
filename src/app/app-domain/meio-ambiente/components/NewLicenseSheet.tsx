"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetTrigger 
} from "@/components/ui/sheet";
import { createEnvLicense } from "../actions";

export function NewLicenseSheet({ enterprises }: { enterprises: { id: string, name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await createEnvLicense(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
    }
    setLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<button className="flex h-8 items-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-medium text-white transition-colors hover:bg-blue-700" />}>
        <FileText className="h-5 w-5" />
        Nova Licença
      </SheetTrigger>
      <SheetContent side="right" className="w-[calc(100vw-1rem)] overflow-y-auto sm:w-[34rem]">
        <SheetHeader>
          <SheetTitle>Emitir Licença</SheetTitle>
          <SheetDescription>
            Vincule uma licença ambiental a um empreendimento.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 pb-2">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Empreendimento</label>
            <select name="enterpriseId" className="w-full p-2 border rounded-md" required>
              <option value="">Selecione...</option>
              {enterprises.map((ent) => (
                <option key={ent.id} value={ent.id}>{ent.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Número da Licença</label>
            <input 
              name="licenseNumber" 
              required 
              className="w-full p-2 border rounded-md" 
              placeholder="Ex: LA-2026/001"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Licença</label>
            <select name="licenseType" className="w-full p-2 border rounded-md" required>
              <option value="">Selecione...</option>
              <option value="Prévia (LP)">Prévia (LP)</option>
              <option value="De Instalação (LI)">De Instalação (LI)</option>
              <option value="De Operação (LO)">De Operação (LO)</option>
              <option value="Simplificada">Simplificada</option>
              <option value="Autorização">Autorização Ambiental</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Validade (Opcional)</label>
            <input 
              type="date"
              name="validUntil" 
              className="w-full p-2 border rounded-md" 
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Emitir Licença"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
