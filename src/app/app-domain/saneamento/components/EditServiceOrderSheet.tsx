"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { updateServiceOrder } from "../actions";

type ServiceOrder = {
  id: string;
  orderNumber: string;
  orderType: string;
  description: string;
  priority: string;
  status: string;
  technician: string | null;
};

export function EditServiceOrderSheet({ order }: { order: ServiceOrder }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const result = await updateServiceOrder(order.id, {
        orderType: formData.get("orderType") as string,
        description: formData.get("description") as string,
        priority: formData.get("priority") as string,
        status: formData.get("status") as string,
        technician: formData.get("technician") as string,
      });
      if (result.error) {
        alert(result.error);
        return;
      }
      setOpen(false);
    } catch {
      alert("Erro ao atualizar ordem de serviço.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<button className="p-1.5 text-slate-400 hover:text-[#0284C7] hover:bg-blue-50 rounded transition-colors" title="Editar OS" />}>
        <Pencil className="h-3.5 w-3.5" />
      </SheetTrigger>
      <SheetContent side="right" className="w-[calc(100vw-1rem)] overflow-y-auto sm:w-[34rem]">
        <SheetHeader>
          <SheetTitle>Editar Ordem de Serviço</SheetTitle>
          <SheetDescription>
            OS nº <strong>{order.orderNumber}</strong>
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 pb-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Serviço</label>
            <select name="orderType" required defaultValue={order.orderType} className="w-full p-2 border rounded-md text-sm">
              <option value="Vazamento">Vazamento na Rede</option>
              <option value="Religação">Religação de Água</option>
              <option value="Corte">Corte por Inadimplência</option>
              <option value="Manutenção">Manutenção Preventiva</option>
              <option value="Troca de Hidrômetro">Troca de Hidrômetro</option>
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Prioridade</label>
              <select name="priority" required defaultValue={order.priority} className="w-full p-2 border rounded-md text-sm">
                <option value="Normal">Normal</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select name="status" required defaultValue={order.status} className="w-full p-2 border rounded-md text-sm">
                <option value="Aberta">Aberta</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Concluída">Concluída</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Técnico Responsável</label>
            <input
              name="technician"
              defaultValue={order.technician ?? ""}
              className="w-full p-2 border rounded-md text-sm"
              placeholder="Nome do técnico"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição</label>
            <textarea
              name="description"
              required
              rows={4}
              defaultValue={order.description}
              className="w-full p-2 border rounded-md text-sm"
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
              className="px-4 py-2 text-sm font-medium text-white bg-[#0284C7] rounded-md hover:bg-[#0369A1] disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
