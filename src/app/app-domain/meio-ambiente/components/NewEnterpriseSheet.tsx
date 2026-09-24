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
import { createEnvEnterprise } from "../actions";

export function NewEnterpriseSheet() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await createEnvEnterprise(formData);

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
        Novo Empreendimento
      </SheetTrigger>
      <SheetContent side="right" className="w-[calc(100vw-1rem)] overflow-y-auto sm:w-[34rem]">
        <SheetHeader>
          <SheetTitle>Cadastrar Empreendimento</SheetTitle>
          <SheetDescription>
            Registre uma nova atividade sujeita a controle ambiental.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 pb-2">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome / Razão Social</label>
            <input 
              name="name" 
              required 
              className="w-full p-2 border rounded-md" 
              placeholder="Ex: Indústria XYZ Ltda"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">CNPJ / CPF</label>
            <input 
              name="cnpjCpf" 
              className="w-full p-2 border rounded-md" 
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Atividade</label>
            <select name="activityType" className="w-full p-2 border rounded-md" required>
              <option value="">Selecione...</option>
              <option value="Indústria">Indústria</option>
              <option value="Comércio">Comércio</option>
              <option value="Serviços">Serviços</option>
              <option value="Posto de Combustível">Posto de Combustível</option>
              <option value="Extração">Extração Mineral</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Potencial de Risco</label>
            <select name="potentialRisk" className="w-full p-2 border rounded-md" required>
              <option value="Baixo">Baixo</option>
              <option value="Médio">Médio</option>
              <option value="Alto">Alto</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Endereço Completo</label>
            <textarea 
              name="address" 
              className="w-full p-2 border rounded-md" 
              rows={3}
              placeholder="Rua, número, bairro..."
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
              {loading ? "Salvando..." : "Salvar Empreendimento"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
