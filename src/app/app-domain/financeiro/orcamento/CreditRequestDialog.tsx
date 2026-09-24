"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { actionCreateCreditRequest } from "./planejamento-actions";
import { PlusCircle, ShieldAlert } from "lucide-react";

type AppropriationOption = {
  id: string;
  code: string;
  availableValue: number;
};

type CreditItem = {
  appropriationId: string;
  type: "Acréscimo" | "Anulação";
  value: number;
};
type ResourceSourceOption = { id: string; code: string; name: string };
type LegalDocumentOption = { id: string; title: string };

export function CreditRequestDialog({
  financialYearId,
  appropriations,
  resourceSources,
  legalDocuments,
}: {
  financialYearId: string;
  appropriations: AppropriationOption[];
  resourceSources: ResourceSourceOption[];
  legalDocuments: LegalDocumentOption[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [number, setNumber] = useState("");
  const [type, setType] = useState<"Suplementar" | "Especial" | "Extraordinário" | "Remanejamento" | "Transposição" | "Transferência">("Suplementar");
  const [lawNumber, setLawNumber] = useState("");
  const [legalActDate, setLegalActDate] = useState("");
  const [legalDocumentId, setLegalDocumentId] = useState("");
  const [fundingSourceId, setFundingSourceId] = useState("");
  const [justification, setJustification] = useState("");
  const [items, setItems] = useState<CreditItem[]>([
    { appropriationId: "", type: "Acréscimo", value: 0 },
  ]);

  const addItem = () => {
    setItems([...items, { appropriationId: "", type: "Acréscimo", value: 0 }]);
  };

  const updateItem = <K extends keyof CreditItem>(index: number, field: K, value: CreditItem[K]) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    setItems(next);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);

    const result = await actionCreateCreditRequest({
      number,
      financialYearId,
      type,
      lawNumber: lawNumber || undefined,
      legalActNumber: lawNumber,
      legalActDate,
      legalDocumentId,
      fundingSourceId,
      justification,
      items: items.filter((item) => item.appropriationId && item.value > 0),
    });

    setPending(false);

    if (result.error) {
      alert(result.error);
      return;
    }

    setOpen(false);
    setNumber("");
    setJustification("");
    setItems([{ appropriationId: "", type: "Acréscimo", value: 0 }]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90">
        <PlusCircle className="h-4 w-4" /> Solicitar Crédito Adicional
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Nova Solicitação de Crédito Adicional
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Número do Crédito</Label>
              <Input
                required
                placeholder="Ex: CA-001/2026"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Crédito</Label>
                <Select value={type} onValueChange={(value) => setType(value as typeof type)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Suplementar">Suplementar</SelectItem>
                  <SelectItem value="Especial">Especial</SelectItem>
                  <SelectItem value="Extraordinário">Extraordinário</SelectItem>
                  <SelectItem value="Remanejamento">Remanejamento</SelectItem>
                  <SelectItem value="Transposição">Transposição</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Lei / Decreto Autorizador</Label>
            <Input
              placeholder="Ex: Lei Municipal N.º 1.420/2026"
              value={lawNumber}
              onChange={(e) => setLawNumber(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2"><Label>Data do Ato Legal</Label><Input required type="date" value={legalActDate} onChange={(e) => setLegalActDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>Fonte de Recursos</Label><Select value={fundingSourceId} onValueChange={(value) => setFundingSourceId(value ?? "")}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{resourceSources.map((source) => <SelectItem key={source.id} value={source.id}>{source.code} - {source.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="space-y-2"><Label>Documento GED Final</Label><Select value={legalDocumentId} onValueChange={(value) => setLegalDocumentId(value ?? "")}><SelectTrigger><SelectValue placeholder="Selecione o ato finalizado" /></SelectTrigger><SelectContent>{legalDocuments.map((document) => <SelectItem key={document.id} value={document.id}>{document.title}</SelectItem>)}</SelectContent></Select></div>

          <div className="space-y-2">
            <Label>Justificativa Legal / Técnica</Label>
            <Input
              required
              placeholder="Descreva o motivo e a necessidade da alteração orçamentária"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Itens da Alteração (Acréscimos e Anulações)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                + Adicionar Item
              </Button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="grid items-center gap-2 rounded-md border bg-muted/30 p-3 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <Select
                    value={item.appropriationId}
                    onValueChange={(value) => updateItem(idx, "appropriationId", value ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a Dotação" />
                    </SelectTrigger>
                    <SelectContent>
                      {appropriations.map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          {app.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-3">
                  <Select
                    value={item.type}
                    onValueChange={(value) => updateItem(idx, "type", value as CreditItem["type"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Acréscimo">Acréscimo (+)</SelectItem>
                      <SelectItem value="Anulação">Anulação (-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-3">
                  <MoneyInput
                    value={item.value}
                    onChange={(val) => updateItem(idx, "value", val)}
                  />
                </div>
                <div className="text-right sm:col-span-1">
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => removeItem(idx)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Enviando..." : "Submeter para Aprovação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
