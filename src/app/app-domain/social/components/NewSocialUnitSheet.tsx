"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { createSocialUnit } from "../actions";

export function NewSocialUnitSheet() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      type: formData.get("type") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
    };

    const res = await createSocialUnit(data);
    setLoading(false);
    if (res.success) {
      setOpen(false);
    } else {
      alert(res.error);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors" />}>
        <Plus className="h-5 w-5" />
        Nova Unidade
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nova Unidade Socioassistencial</SheetTitle>
          <SheetDescription>
            Cadastre um novo CRAS, CREAS ou outro equipamento.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome da Unidade</Label>
            <Input id="name" name="name" required placeholder="Ex: CRAS Centro" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="type">Tipo</Label>
            <Input id="type" name="type" required placeholder="Ex: CRAS, CREAS, Centro POP" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" name="phone" placeholder="(00) 0000-0000" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="unidade@cidade.gov.br" />
          </div>
          <Button type="submit" disabled={loading} className="mt-4 bg-orange-600 hover:bg-orange-700">
            {loading ? "Salvando..." : "Salvar Unidade"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
