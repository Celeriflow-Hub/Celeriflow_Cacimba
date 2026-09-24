"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { updateEnvGreenArea } from "../actions";

interface GreenArea {
  id: string;
  name: string;
  areaType: string;
  sizeSqm: number | null;
  location: string | null;
  status: string;
  notes: string | null;
}

interface EditGreenAreaSheetProps {
  area: GreenArea;
  open: boolean;
  onClose: () => void;
}

export function EditGreenAreaSheet({ area, open, onClose }: EditGreenAreaSheetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await updateEnvGreenArea(area.id, formData);
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
          <SheetTitle>Editar Area Verde</SheetTitle>
          <SheetDescription>Atualize os dados da area verde ou de conservacao.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 pb-2">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome da Area Verde</label>
            <input name="name" required defaultValue={area.name} className="w-full p-2 border rounded-md text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Area</label>
            <select name="areaType" defaultValue={area.areaType} className="w-full p-2 border rounded-md text-sm" required>
              <option value="">Selecione...</option>
              <option value="Parque Urbano">Parque Urbano</option>
              <option value="Reserva Ecologica">Reserva Ecologica</option>
              <option value="APP (Area de Preservacao Permanente)">APP (Area de Preservacao Permanente)</option>
              <option value="Praca/Area de Lazer">Praca/Area de Lazer</option>
              <option value="Floresta Municipal">Floresta Municipal</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tamanho da Area (m2)</label>
            <input name="sizeSqm" type="number" step="any" defaultValue={area.sizeSqm ?? ""} className="w-full p-2 border rounded-md text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Localizacao / Coordenadas</label>
            <input name="location" defaultValue={area.location || ""} className="w-full p-2 border rounded-md text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status de Conservacao</label>
            <select name="status" defaultValue={area.status} className="w-full p-2 border rounded-md text-sm">
              <option value="Preservado">Preservado</option>
              <option value="Em Recuperacao">Em Recuperacao</option>
              <option value="Degradado">Degradado</option>
              <option value="Monitorado">Monitorado</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Observacoes</label>
            <textarea name="notes" defaultValue={area.notes || ""} className="w-full p-2 border rounded-md text-sm" rows={3} />
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
