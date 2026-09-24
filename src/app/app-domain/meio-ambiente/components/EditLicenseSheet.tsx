"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { updateEnvLicense } from "../actions";

interface License {
  id: string;
  licenseNumber: string;
  licenseType: string;
  validUntil: Date | null;
  status: string;
}

interface EditLicenseSheetProps {
  license: License;
  open: boolean;
  onClose: () => void;
}

export function EditLicenseSheet({ license, open, onClose }: EditLicenseSheetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await updateEnvLicense(license.id, formData);
    if (result.error) {
      setError(result.error);
    } else {
      onClose();
    }
    setLoading(false);
  };

  const validUntilValue = license.validUntil
    ? new Date(license.validUntil).toISOString().split("T")[0]
    : "";

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[calc(100vw-1rem)] overflow-y-auto sm:w-[34rem]">
        <SheetHeader>
          <SheetTitle>Editar Licenca</SheetTitle>
          <SheetDescription>Atualize os dados da licenca ambiental.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 pb-2">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-medium">Numero da Licenca</label>
            <input name="licenseNumber" required defaultValue={license.licenseNumber} className="w-full p-2 border rounded-md" placeholder="Ex: LA-2026/001" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Licenca</label>
            <select name="licenseType" defaultValue={license.licenseType} className="w-full p-2 border rounded-md" required>
              <option value="">Selecione...</option>
              <option value="Previa (LP)">Previa (LP)</option>
              <option value="De Instalacao (LI)">De Instalacao (LI)</option>
              <option value="De Operacao (LO)">De Operacao (LO)</option>
              <option value="Simplificada">Simplificada</option>
              <option value="Autorizacao">Autorizacao Ambiental</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select name="status" defaultValue={license.status} className="w-full p-2 border rounded-md">
              <option value="Em Analise">Em Analise</option>
              <option value="Emitida">Emitida</option>
              <option value="Vencida">Vencida</option>
              <option value="Suspensa">Suspensa</option>
              <option value="Cassada">Cassada</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Validade</label>
            <input type="date" name="validUntil" defaultValue={validUntilValue} className="w-full p-2 border rounded-md" />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Salvando..." : "Salvar Alteracoes"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
