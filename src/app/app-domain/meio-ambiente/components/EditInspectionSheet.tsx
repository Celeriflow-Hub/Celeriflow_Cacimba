"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { updateEnvInspection } from "../actions";

interface Inspection {
  id: string;
  dateScheduled: Date | null;
  inspector: string | null;
  notes: string | null;
  status: string;
  enterpriseId: string | null;
}

interface EditInspectionSheetProps {
  inspection: Inspection;
  enterprises: { id: string; name: string }[];
  open: boolean;
  onClose: () => void;
}

export function EditInspectionSheet({ inspection, enterprises, open, onClose }: EditInspectionSheetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await updateEnvInspection(inspection.id, formData);
    if (result.error) {
      setError(result.error);
    } else {
      onClose();
    }
    setLoading(false);
  };

  const dateValue = inspection.dateScheduled
    ? new Date(inspection.dateScheduled).toISOString().slice(0, 16)
    : "";

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[calc(100vw-1rem)] overflow-y-auto sm:w-[34rem]">
        <SheetHeader>
          <SheetTitle>Editar Vistoria</SheetTitle>
          <SheetDescription>Atualize os dados da vistoria ou fiscalizacao.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 pb-2">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-medium">Data e Hora Agendada</label>
            <input type="datetime-local" name="dateScheduled" defaultValue={dateValue} className="w-full p-2 border rounded-md text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Fiscal Responsavel</label>
            <input name="inspector" defaultValue={inspection.inspector || ""} className="w-full p-2 border rounded-md text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Empreendimento Vinculado</label>
            <select name="enterpriseId" defaultValue={inspection.enterpriseId || ""} className="w-full p-2 border rounded-md text-sm">
              <option value="">Nenhum (vistoria avulsa)</option>
              {enterprises.map((e) => (<option key={e.id} value={e.id}>{e.name}</option>))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select name="status" defaultValue={inspection.status} className="w-full p-2 border rounded-md text-sm">
              <option value="Agendada">Agendada</option>
              <option value="Em Andamento">Em Andamento</option>
              <option value="Realizada">Realizada</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Observacoes / Resultado</label>
            <textarea name="notes" defaultValue={inspection.notes || ""} className="w-full p-2 border rounded-md text-sm" rows={4} />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50">
              {loading ? "Salvando..." : "Salvar Alteracoes"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
