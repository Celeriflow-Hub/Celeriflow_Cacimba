"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { updateEnvComplaint } from "../actions";

interface Complaint {
  id: string;
  complaintType: string;
  description: string;
  address: string | null;
  status: string;
}

interface EditComplaintSheetProps {
  complaint: Complaint;
  open: boolean;
  onClose: () => void;
}

export function EditComplaintSheet({ complaint, open, onClose }: EditComplaintSheetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await updateEnvComplaint(complaint.id, formData);
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
          <SheetTitle>Editar Denuncia</SheetTitle>
          <SheetDescription>Atualize o status ou dados da denuncia.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 pb-2">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Denuncia</label>
            <input readOnly value={complaint.complaintType} className="w-full p-2 border rounded-md text-sm bg-gray-50 text-gray-500" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Descricao</label>
            <textarea name="description" defaultValue={complaint.description} className="w-full p-2 border rounded-md text-sm" rows={4} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Endereco</label>
            <input name="address" defaultValue={complaint.address || ""} className="w-full p-2 border rounded-md text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status da Denuncia</label>
            <select name="status" defaultValue={complaint.status} className="w-full p-2 border rounded-md text-sm">
              <option value="Recebida">Recebida</option>
              <option value="Em Triagem">Em Triagem</option>
              <option value="Em Vistoria">Em Vistoria</option>
              <option value="Encerrada">Encerrada</option>
            </select>
          </div>
          <div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50">
              {loading ? "Salvando..." : "Salvar Alteracoes"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
