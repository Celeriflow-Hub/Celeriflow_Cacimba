"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { updateEnvEnterprise } from "../actions";

interface Enterprise {
  id: string;
  name: string;
  cnpjCpf: string | null;
  activityType: string | null;
  potentialRisk: string | null;
  address: string | null;
  status: string;
}

interface EditEnterpriseSheetProps {
  enterprise: Enterprise;
  open: boolean;
  onClose: () => void;
}

export function EditEnterpriseSheet({ enterprise, open, onClose }: EditEnterpriseSheetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await updateEnvEnterprise(enterprise.id, formData);
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
          <SheetTitle>Editar Empreendimento</SheetTitle>
          <SheetDescription>Atualize os dados do empreendimento.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 pb-2">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome / Razao Social</label>
            <input name="name" required defaultValue={enterprise.name} className="w-full p-2 border rounded-md" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">CNPJ / CPF</label>
            <input name="cnpjCpf" defaultValue={enterprise.cnpjCpf || ""} className="w-full p-2 border rounded-md" placeholder="00.000.000/0000-00" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Atividade</label>
            <select name="activityType" defaultValue={enterprise.activityType || ""} className="w-full p-2 border rounded-md">
              <option value="">Selecione...</option>
              <option value="Industria">Industria</option>
              <option value="Comercio">Comercio</option>
              <option value="Servicos">Servicos</option>
              <option value="Posto de Combustivel">Posto de Combustivel</option>
              <option value="Extracao">Extracao Mineral</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Potencial de Risco</label>
            <select name="potentialRisk" defaultValue={enterprise.potentialRisk || "Baixo"} className="w-full p-2 border rounded-md">
              <option value="Baixo">Baixo</option>
              <option value="Medio">Medio</option>
              <option value="Alto">Alto</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select name="status" defaultValue={enterprise.status} className="w-full p-2 border rounded-md">
              <option value="Ativo">Ativo</option>
              <option value="Irregular">Irregular</option>
              <option value="Embargado">Embargado</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Endereco Completo</label>
            <textarea name="address" defaultValue={enterprise.address || ""} className="w-full p-2 border rounded-md" rows={3} />
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
