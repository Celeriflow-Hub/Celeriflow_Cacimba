"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { updateEnvEduProgram } from "../actions";

interface EduProgram {
  id: string;
  title: string;
  description: string;
  targetAudience: string | null;
  startDate: Date;
  endDate: Date | null;
  participantsCount: number | null;
  status: string;
}

interface EditEduProgramSheetProps {
  program: EduProgram;
  open: boolean;
  onClose: () => void;
}

export function EditEduProgramSheet({ program, open, onClose }: EditEduProgramSheetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await updateEnvEduProgram(program.id, formData);
    if (result.error) {
      setError(result.error);
    } else {
      onClose();
    }
    setLoading(false);
  };

  const startDateValue = new Date(program.startDate).toISOString().split("T")[0];
  const endDateValue = program.endDate ? new Date(program.endDate).toISOString().split("T")[0] : "";

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[calc(100vw-1rem)] overflow-y-auto sm:w-[34rem]">
        <SheetHeader>
          <SheetTitle>Editar Programa Educativo</SheetTitle>
          <SheetDescription>Atualize os dados da acao de educacao ambiental.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 pb-2">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-medium">Titulo da Acao</label>
            <input name="title" required defaultValue={program.title} className="w-full p-2 border rounded-md text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Descricao</label>
            <textarea name="description" required defaultValue={program.description} className="w-full p-2 border rounded-md text-sm" rows={3} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Publico-Alvo</label>
            <select name="targetAudience" defaultValue={program.targetAudience || ""} className="w-full p-2 border rounded-md text-sm">
              <option value="">Selecione...</option>
              <option value="Escolas">Escolas</option>
              <option value="Populacao Geral">Populacao Geral</option>
              <option value="Empresas">Empresas</option>
              <option value="Criancas">Criancas</option>
              <option value="Todos">Todos</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Inicio</label>
              <input type="date" name="startDate" required defaultValue={startDateValue} className="w-full p-2 border rounded-md text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Termino</label>
              <input type="date" name="endDate" defaultValue={endDateValue} className="w-full p-2 border rounded-md text-sm" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">No de Participantes</label>
            <input name="participantsCount" type="number" defaultValue={program.participantsCount ?? ""} className="w-full p-2 border rounded-md text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select name="status" defaultValue={program.status} className="w-full p-2 border rounded-md text-sm">
              <option value="Planejado">Planejado</option>
              <option value="Em Execucao">Em Execucao</option>
              <option value="Concluido">Concluido</option>
              <option value="Cancelado">Cancelado</option>
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
