"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { updateEnvWaste } from "../actions";

interface Waste {
  id: string;
  generatorName: string;
  wasteType: string;
  quantityKg: number;
  destination: string;
  notes: string | null;
  enterpriseId: string | null;
}

interface EditWasteSheetProps {
  waste: Waste;
  enterprises: { id: string; name: string }[];
  open: boolean;
  onClose: () => void;
}

export function EditWasteSheet({ waste, enterprises, open, onClose }: EditWasteSheetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await updateEnvWaste(waste.id, formData);
    if (result.error) {
      setError(result.error);
    } else {
      onClose();
    }
    setLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[calc(100vw-1rem)] overflow-y-auto sm:w-[34rem]">
        <SheetHeader>
          <SheetTitle>Editar Residuo</SheetTitle>
          <SheetDescription>Atualize os dados do registro de residuo.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 pb-2">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome do Gerador / Empresa</label>
            <input name="generatorName" required defaultValue={waste.generatorName} className="w-full p-2 border rounded-md text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Residuo</label>
            <select name="wasteType" defaultValue={waste.wasteType} className="w-full p-2 border rounded-md text-sm" required>
              <option value="">Selecione...</option>
              <option value="Organico">Organico</option>
              <option value="Reciclavel">Reciclavel</option>
              <option value="Perigoso">Perigoso (Classe I)</option>
              <option value="Nao Perigoso">Nao Perigoso (Classe II)</option>
              <option value="Eletronico">Eletronico (REEE)</option>
              <option value="Construcao Civil">Construcao Civil (RCC)</option>
              <option value="Servicos de Saude">Servicos de Saude (RSS)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Quantidade (Kg)</label>
            <input name="quantityKg" type="number" step="any" required defaultValue={waste.quantityKg} className="w-full p-2 border rounded-md text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Destinacao Final</label>
            <select name="destination" defaultValue={waste.destination} className="w-full p-2 border rounded-md text-sm" required>
              <option value="">Selecione...</option>
              <option value="Aterro Sanitario">Aterro Sanitario</option>
              <option value="Reciclagem">Reciclagem</option>
              <option value="Compostagem">Compostagem</option>
              <option value="Coprocessamento">Coprocessamento Industrial</option>
              <option value="Incineracao">Incineracao</option>
              <option value="Logistica Reversa">Logistica Reversa</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Empresa Vinculada (Opcional)</label>
            <select name="enterpriseId" defaultValue={waste.enterpriseId || ""} className="w-full p-2 border rounded-md text-sm">
              <option value="">Nenhuma</option>
              {enterprises.map((e) => (<option key={e.id} value={e.id}>{e.name}</option>))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Observacoes</label>
            <textarea name="notes" defaultValue={waste.notes || ""} className="w-full p-2 border rounded-md text-sm" rows={3} />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50">
              {loading ? "Salvando..." : "Salvar Alteracoes"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
