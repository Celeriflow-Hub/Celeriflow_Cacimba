"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetTrigger 
} from "@/components/ui/sheet";
import { createVereador } from "../actions";

export function NewVereadorSheet({ legislaturas }: { legislaturas: { id: string; numero: number }[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await createVereador({
        nomeCompleto: formData.get("nomeCompleto") as string,
        nomeParlamentar: formData.get("nomeParlamentar") as string,
        cpf: formData.get("cpf") as string,
        partido: formData.get("partido") as string,
        legislaturaId: formData.get("legislaturaId") as string,
      });
      setOpen(false);
    } catch (error) {
      console.error(error);
      alert("Erro ao cadastrar vereador.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<button className="flex items-center gap-2 bg-[#9333EA] hover:bg-[#7E22CE] text-white px-4 py-2 rounded-lg font-medium transition-colors" />}>
        <UserPlus className="h-5 w-5" />
        Novo Vereador
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Cadastrar Vereador</SheetTitle>
          <SheetDescription>
            Registre um novo parlamentar vinculando-o à legislatura atual.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome Completo</label>
            <input
              name="nomeCompleto"
              required
              className="w-full p-2 border rounded-md"
              placeholder="Ex: João Silva Souza"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome Parlamentar</label>
            <input
              name="nomeParlamentar"
              required
              className="w-full p-2 border rounded-md"
              placeholder="Ex: Joãozinho do Povo"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">CPF (Opcional)</label>
            <input
              name="cpf"
              className="w-full p-2 border rounded-md"
              placeholder="000.000.000-00"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Partido Atual (Opcional)</label>
            <input
              name="partido"
              className="w-full p-2 border rounded-md"
              placeholder="Ex: PMDB, PT, PSDB..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Legislatura</label>
            <select name="legislaturaId" required className="w-full p-2 border rounded-md">
              <option value="">Selecione...</option>
              {legislaturas.map(leg => (
                <option key={leg.id} value={leg.id}>
                  Legislatura {leg.numero}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-2">
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
              className="px-4 py-2 text-sm font-medium text-white bg-[#9333EA] rounded-md hover:bg-[#7E22CE] disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar Vereador"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
