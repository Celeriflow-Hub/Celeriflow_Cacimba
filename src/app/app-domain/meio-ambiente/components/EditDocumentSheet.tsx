"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { updateEnvDocument } from "../actions";

interface EnvDoc {
  id: string;
  title: string;
  docType: string;
  enterpriseId: string | null;
}

interface EditDocumentSheetProps {
  doc: EnvDoc;
  enterprises: { id: string; name: string }[];
  open: boolean;
  onClose: () => void;
}

export function EditDocumentSheet({ doc, enterprises, open, onClose }: EditDocumentSheetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await updateEnvDocument(doc.id, formData);
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
          <SheetTitle>Editar Documento</SheetTitle>
          <SheetDescription>Atualize o titulo, tipo ou empreendimento vinculado.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 pb-2">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-medium">Titulo do Documento</label>
            <input name="title" required defaultValue={doc.title} className="w-full p-2 border rounded-md text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo do Documento</label>
            <select name="docType" defaultValue={doc.docType} className="w-full p-2 border rounded-md text-sm" required>
              <option value="">Selecione...</option>
              <option value="Laudo/Relatorio Tecnico">Laudo/Relatorio Tecnico</option>
              <option value="Termo de Compromisso">Termo de Compromisso</option>
              <option value="Parecer Tecnico">Parecer Tecnico</option>
              <option value="Alvara/Autorizacao Especial">Alvara/Autorizacao Especial</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Empreendimento Vinculado (Opcional)</label>
            <select name="enterpriseId" defaultValue={doc.enterpriseId || ""} className="w-full p-2 border rounded-md text-sm">
              <option value="">Documento Geral (sem vinculo)</option>
              {enterprises.map((e) => (<option key={e.id} value={e.id}>{e.name}</option>))}
            </select>
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
