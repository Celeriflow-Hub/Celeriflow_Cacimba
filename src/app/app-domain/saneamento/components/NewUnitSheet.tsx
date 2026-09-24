"use client";

import { useState } from "react";
import { Droplets } from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetTrigger 
} from "@/components/ui/sheet";
import { createConsumerUnit } from "../actions";

export function NewUnitSheet() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await createConsumerUnit({
        code: formData.get("code") as string,
        address: formData.get("address") as string,
        category: formData.get("category") as string,
        ownerName: formData.get("ownerName") as string,
        ownerDocument: formData.get("ownerDocument") as string,
      });
      if (result.error) {
        alert(result.error);
        return;
      }
      setOpen(false);
    } catch {
      alert("Erro ao cadastrar unidade consumidora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<button className="flex h-8 items-center gap-2 rounded-md bg-[#0284C7] px-3 text-sm font-medium text-white transition-colors hover:bg-[#0369A1]" />}>
        <Droplets className="h-5 w-5" />
        Nova Unidade Consumidora
      </SheetTrigger>
      <SheetContent side="right" className="w-[calc(100vw-1rem)] overflow-y-auto sm:w-[34rem]">
        <SheetHeader>
          <SheetTitle>Cadastrar Unidade</SheetTitle>
          <SheetDescription>
            Registre um novo ponto de ligação de água/esgoto.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 pb-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Código (Ligação)</label>
            <input
              name="code"
              required
              className="w-full p-2 border rounded-md"
              placeholder="Ex: LIG-12345"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Endereço</label>
            <input
              name="address"
              required
              className="w-full p-2 border rounded-md"
              placeholder="Rua, Número, Bairro"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoria</label>
            <select name="category" required className="w-full p-2 border rounded-md">
              <option value="Residencial">Residencial</option>
              <option value="Comercial">Comercial</option>
              <option value="Industrial">Industrial</option>
              <option value="Pública">Pública</option>
              <option value="Rural">Rural</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome do Titular</label>
            <input
              name="ownerName"
              required
              className="w-full p-2 border rounded-md"
              placeholder="Nome completo"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">CPF / CNPJ</label>
            <input
              name="ownerDocument"
              required
              className="w-full p-2 border rounded-md"
              placeholder="000.000.000-00"
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
              {loading ? "Salvando..." : "Salvar Unidade"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
