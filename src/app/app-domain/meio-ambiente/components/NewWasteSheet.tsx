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
import { createEnvWaste } from "../actions";

export function NewWasteSheet({ enterprises }: { enterprises: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await createEnvWaste(formData);

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
        Registrar Resíduo
      </SheetTrigger>
      <SheetContent side="right" className="w-[calc(100vw-1rem)] overflow-y-auto sm:w-[34rem]">
        <SheetHeader>
          <SheetTitle>Registrar Resíduo</SheetTitle>
          <SheetDescription>
            Registre a destinação de resíduos gerados por empreendimentos ou atividades municipais.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 pb-2">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome do Gerador / Empresa</label>
            <input 
              name="generatorName" 
              required 
              className="w-full p-2 border rounded-md text-sm" 
              placeholder="Ex: Indústria Química Fênix S/A"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Vincular a Empreendimento Cadastrado (Opcional)</label>
            <select name="enterpriseId" className="w-full p-2 border rounded-md text-sm">
              <option value="">Nenhum (Gerador não cadastrado)</option>
              {enterprises.map((ent) => (
                <option key={ent.id} value={ent.id}>{ent.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Resíduo</label>
            <select name="wasteType" className="w-full p-2 border rounded-md text-sm" required>
              <option value="">Selecione...</option>
              <option value="Resíduos Orgânicos">Resíduos Orgânicos</option>
              <option value="Resíduos Recicláveis (Papel/Plástico/Metal)">Resíduos Recicláveis (Papel/Plástico/Metal)</option>
              <option value="Resíduos Químicos Perigosos (Classe I)">Resíduos Químicos Perigosos (Classe I)</option>
              <option value="Óleos Lubrificantes Usados (Classe I)">Óleos Lubrificantes Usados (Classe I)</option>
              <option value="Resíduos da Construção Civil (Classe A/B)">Resíduos da Construção Civil (Classe A/B)</option>
              <option value="Resíduos Eletrônicos (Lixo Eletrônico)">Resíduos Eletrônicos (Lixo Eletrônico)</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Quantidade (Kg)</label>
            <input 
              name="quantityKg" 
              type="number"
              step="any"
              required
              className="w-full p-2 border rounded-md text-sm" 
              placeholder="Ex: 450.50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Destinação Final</label>
            <select name="destination" className="w-full p-2 border rounded-md text-sm" required>
              <option value="">Selecione...</option>
              <option value="Co-processamento e Incineração Licenciada">Co-processamento e Incineração Licenciada</option>
              <option value="Rerrefino Industrial">Rerrefino Industrial</option>
              <option value="Aterro de Inertes Municipal">Aterro de Inertes Municipal</option>
              <option value="Compostagem Urbana/Rural">Compostagem Urbana/Rural</option>
              <option value="Reciclagem e Triagem Coletiva">Reciclagem e Triagem Coletiva</option>
              <option value="Aterro Sanitário">Aterro Sanitário</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Observações / Detalhes</label>
            <textarea 
              name="notes" 
              className="w-full p-2 border rounded-md text-sm" 
              rows={3}
              placeholder="Ex: Transporte realizado pela empresa EcoCarga, CADRI nº 12345..."
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
              {loading ? "Salvando..." : "Salvar Registro"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
