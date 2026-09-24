"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardCheck, Plus, Save, Trash2, UsersRound, WalletCards } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  deleteInstrumentInstallment,
  deleteInstrumentMeasurement,
  deleteInstrumentMeasurementItem,
  deleteInstrumentParty,
  deleteInstrumentResponsibilityGroup,
  saveInstrumentInstallment,
  saveInstrumentMeasurement,
  saveInstrumentMeasurementItem,
  saveInstrumentParty,
  saveInstrumentResponsibilityGroup,
  type InstrumentActionResult,
} from "./instrument-actions";

type InstrumentLifecyclePanelProps = {
  instrument: { id: string; kind: "CONTRACT" | "COVENANT"; status: string };
  responsibilityGroups: Array<{ id: string; name: string; description: string | null; status: string; memberCount: number }>;
  parties: Array<{
    id: string;
    role: string;
    identityReference: string;
    identityLabel: string;
    identityType: string;
    responsibilityGroupId: string | null;
    responsibilityGroupName: string | null;
    status: string;
    activeFrom: string | null;
    activeTo: string | null;
    notes: string | null;
  }>;
  partyOptions: Array<{ value: string; label: string; type: string }>;
  measurements: Array<{
    id: string;
    number: number;
    description: string | null;
    periodStart: string | null;
    periodEnd: string | null;
    measuredAt: string;
    status: string;
    quantity: number | null;
    unit: string | null;
    valueDecimal: number;
    documentId: string | null;
    documentTitle: string | null;
    items: Array<{
      id: string;
      purchaseProcessItemId: string | null;
      purchaseProcessItemLabel: string | null;
      purchaseReceiptItemLabel: string | null;
      description: string;
      quantity: number;
      unit: string;
      unitValueDecimal: number | null;
      valueDecimal: number;
    }>;
  }>;
  processItems: Array<{ id: string; label: string }>;
  documents: Array<{ id: string; title: string }>;
  installments: Array<{
    id: string;
    number: number;
    dueDate: string | null;
    periodStart: string | null;
    periodEnd: string | null;
    quantity: number | null;
    unit: string | null;
    valueDecimal: number;
    status: string;
    payment: { orderNumber: string; date: string; value: number; status: string } | null;
  }>;
};

type FormAction = (formData: FormData) => Promise<InstrumentActionResult>;

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function newIdempotencyKey() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toDateInput(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value)) : "Não informado";
}

function instrumentLabel(kind: "CONTRACT" | "COVENANT") {
  return kind === "CONTRACT" ? "contrato" : "convênio";
}

function HiddenInstrumentFields({ instrument }: { instrument: InstrumentLifecyclePanelProps["instrument"] }) {
  return <><input type="hidden" name="instrumentType" value={instrument.kind} /><input type="hidden" name="instrumentId" value={instrument.id} /><input type="hidden" name="idempotencyKey" defaultValue={newIdempotencyKey()} /></>;
}

function SaveButton({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return <Button type="submit" size="sm" disabled={disabled}><Save className="size-3.5" />{children}</Button>;
}

export function InstrumentLifecyclePanel({ instrument, responsibilityGroups, parties, partyOptions, measurements, processItems, documents, installments }: InstrumentLifecyclePanelProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const isLocked = ["Encerrado", "Rescindido"].includes(instrument.status);

  async function submit(action: FormAction, formData: FormData, successMessage: string) {
    setIsSaving(true);
    setFeedback(null);
    try {
      const result = await action(formData);
      if (!result.success) {
        setFeedback(result.error);
        return;
      }
      setFeedback(successMessage);
      setRevision((current) => current + 1);
      router.refresh();
    } catch {
      setFeedback("Não foi possível concluir a ação. Atualize a página e tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteRecord(action: FormAction, fields: Record<string, string>, successMessage: string, label: string) {
    if (!window.confirm(`Excluir ${label}? Esta ação mantém o evento de auditoria.`)) return;
    const formData = new FormData();
    formData.set("instrumentType", instrument.kind);
    formData.set("instrumentId", instrument.id);
    formData.set("idempotencyKey", newIdempotencyKey());
    for (const [name, value] of Object.entries(fields)) formData.set(name, value);
    await submit(action, formData, successMessage);
  }

  return (
    <div className="space-y-6 text-sm" key={revision}>
      {feedback && <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700" role="status">{feedback}</p>}
      {isLocked && <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">Este {instrumentLabel(instrument.kind)} está {instrument.status.toLocaleLowerCase("pt-BR")}. Os registros de execução permanecem disponíveis apenas para consulta.</p>}

      <section className="space-y-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold"><UsersRound className="size-4 text-indigo-600" />Grupos e partes responsáveis</h2>
          <p className="text-xs text-muted-foreground">Cada parte tem uma identidade cadastral e pode ser vinculada a um grupo de responsabilidade do instrumento.</p>
        </div>

        {!isLocked && <form action={(formData) => submit(saveInstrumentResponsibilityGroup, formData, "Grupo de responsabilidade registrado.")} className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_1.4fr_auto]">
          <HiddenInstrumentFields instrument={instrument} />
          <div className="space-y-1.5"><Label>Nome do grupo</Label><Input name="name" required placeholder="Ex.: Fiscalização" /></div>
          <div className="space-y-1.5"><Label>Descrição</Label><Input name="description" placeholder="Responsabilidade e escopo" /></div>
          <div className="flex items-end"><input type="hidden" name="status" value="Ativo" /><SaveButton disabled={isSaving}><Plus className="size-3.5" />Adicionar grupo</SaveButton></div>
        </form>}

        {responsibilityGroups.length ? <div className="space-y-2">{responsibilityGroups.map((group) => <details key={group.id} className="rounded-md border p-3">
          <summary className="cursor-pointer text-xs font-semibold">{group.name} <span className="font-normal text-muted-foreground">· {group.status} · {group.memberCount} membro{group.memberCount === 1 ? "" : "s"}</span></summary>
          {!isLocked && <form action={(formData) => submit(saveInstrumentResponsibilityGroup, formData, "Grupo de responsabilidade atualizado.")} className="mt-3 grid gap-3 md:grid-cols-2">
            <HiddenInstrumentFields instrument={instrument} />
            <input type="hidden" name="groupId" value={group.id} />
            <div className="space-y-1.5"><Label>Nome</Label><Input name="name" required defaultValue={group.name} /></div>
            <div className="space-y-1.5"><Label>Situação</Label><select name="status" defaultValue={group.status} className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="Ativo">Ativo</option><option value="Inativo">Inativo</option></select></div>
            <div className="space-y-1.5 md:col-span-2"><Label>Descrição</Label><Textarea name="description" defaultValue={group.description ?? ""} rows={2} /></div>
            <div className="flex flex-wrap justify-between gap-2 md:col-span-2"><SaveButton disabled={isSaving}>Salvar grupo</SaveButton><Button type="button" size="sm" variant="outline" disabled={isSaving || group.memberCount > 0} onClick={() => deleteRecord(deleteInstrumentResponsibilityGroup, { groupId: group.id }, "Grupo de responsabilidade excluído.", "este grupo de responsabilidade")}><Trash2 className="size-3.5" />Excluir</Button></div>
          </form>}
        </details>)}</div> : <p className="text-xs text-muted-foreground">Nenhum grupo de responsabilidade registrado.</p>}

        {!isLocked && <form action={(formData) => submit(saveInstrumentParty, formData, "Parte do instrumento registrada.")} className="grid gap-3 rounded-md border p-3 md:grid-cols-2">
          <HiddenInstrumentFields instrument={instrument} />
          <div className="space-y-1.5"><Label>Papel no instrumento</Label><Input name="role" required placeholder="Ex.: Gestor, representante, convenente" /></div>
          <div className="space-y-1.5"><Label>Parte cadastrada</Label><select name="partyReference" required defaultValue="" className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="" disabled>Selecione uma identidade</option>{partyOptions.map((option) => <option key={option.value} value={option.value}>{option.type}: {option.label}</option>)}</select></div>
          <div className="space-y-1.5"><Label>Grupo de responsabilidade</Label><select name="responsibilityGroupId" defaultValue="" className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Sem grupo</option>{responsibilityGroups.filter((group) => group.status === "Ativo").map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Início</Label><Input name="activeFrom" type="date" /></div><div className="space-y-1.5"><Label>Fim</Label><Input name="activeTo" type="date" /></div></div>
          <div className="space-y-1.5 md:col-span-2"><Label>Observações</Label><Textarea name="notes" rows={2} placeholder="Ato de designação, escopo ou observação" /></div>
          <div className="flex justify-end md:col-span-2"><input type="hidden" name="status" value="Ativo" /><SaveButton disabled={isSaving}><Plus className="size-3.5" />Adicionar parte</SaveButton></div>
        </form>}

        {parties.length ? <div className="space-y-2">{parties.map((party) => <details key={party.id} className="rounded-md border p-3">
          <summary className="cursor-pointer text-xs font-semibold">{party.role}: {party.identityLabel} <span className="font-normal text-muted-foreground">· {party.status}{party.responsibilityGroupName ? ` · ${party.responsibilityGroupName}` : ""}</span></summary>
          {!isLocked && <form action={(formData) => submit(saveInstrumentParty, formData, "Parte do instrumento atualizada.")} className="mt-3 grid gap-3 md:grid-cols-2">
            <HiddenInstrumentFields instrument={instrument} />
            <input type="hidden" name="partyId" value={party.id} />
            <div className="space-y-1.5"><Label>Papel</Label><Input name="role" required defaultValue={party.role} /></div>
            <div className="space-y-1.5"><Label>Parte cadastrada</Label><select name="partyReference" defaultValue={party.identityReference} required className="flex h-9 w-full rounded-md border bg-background px-3 text-sm">{partyOptions.map((option) => <option key={option.value} value={option.value}>{option.type}: {option.label}</option>)}</select></div>
            <div className="space-y-1.5"><Label>Grupo</Label><select name="responsibilityGroupId" defaultValue={party.responsibilityGroupId ?? ""} className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Sem grupo</option>{responsibilityGroups.filter((group) => group.status === "Ativo" || group.id === party.responsibilityGroupId).map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></div>
            <div className="space-y-1.5"><Label>Situação</Label><select name="status" defaultValue={party.status} className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="Ativo">Ativo</option><option value="Inativo">Inativo</option></select></div>
            <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Início</Label><Input name="activeFrom" type="date" defaultValue={toDateInput(party.activeFrom)} /></div><div className="space-y-1.5"><Label>Fim</Label><Input name="activeTo" type="date" defaultValue={toDateInput(party.activeTo)} /></div></div>
            <div className="space-y-1.5"><Label>Tipo cadastral</Label><Input value={party.identityType} disabled /></div>
            <div className="space-y-1.5 md:col-span-2"><Label>Observações</Label><Textarea name="notes" defaultValue={party.notes ?? ""} rows={2} /></div>
            <div className="flex flex-wrap justify-between gap-2 md:col-span-2"><SaveButton disabled={isSaving}>Salvar parte</SaveButton><Button type="button" size="sm" variant="outline" disabled={isSaving} onClick={() => deleteRecord(deleteInstrumentParty, { partyId: party.id }, "Parte do instrumento excluída.", "esta parte do instrumento")}><Trash2 className="size-3.5" />Excluir</Button></div>
          </form>}
          {isLocked && <p className="mt-2 text-xs text-muted-foreground">Vigência: {formatDate(party.activeFrom)} a {formatDate(party.activeTo)}</p>}
        </details>)}</div> : <p className="text-xs text-muted-foreground">Nenhuma parte adicional registrada.</p>}
      </section>

      <section className="space-y-3 border-t pt-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold"><ClipboardCheck className="size-4 text-emerald-600" />Medições e execução física</h2>
          <p className="text-xs text-muted-foreground">Medições registram a execução física. O ateste gera AL de Compras quando houver evidência, mas não cria liquidação financeira nem pagamento.</p>
        </div>

        {!isLocked && <form action={(formData) => submit(saveInstrumentMeasurement, formData, "Medição em rascunho registrada.")} className="grid gap-3 rounded-md border p-3 md:grid-cols-3">
          <HiddenInstrumentFields instrument={instrument} />
          <input type="hidden" name="status" value="Rascunho" />
           <div className="space-y-1.5"><Label>Número</Label><Input name="number" required type="number" min="1" step="1" /></div>
           <div className="space-y-1.5"><Label>Data da medição</Label><Input name="measuredAt" required type="date" defaultValue={toDateInput(new Date().toISOString())} /></div>
           <div className="space-y-1.5"><Label>Valor físico aferido (R$)</Label><Input name="valueDecimal" required type="number" min="0" step="0.01" /></div>
           <div className="space-y-1.5"><Label>Documento GED</Label><select name="documentId" defaultValue="" className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Sem documento vinculado</option>{documents.map((document) => <option key={document.id} value={document.id}>{document.title}</option>)}</select></div>
          <div className="space-y-1.5 md:col-span-3"><Label>Descrição</Label><Input name="description" placeholder="Etapa, serviço ou entrega aferida" /></div>
          <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Período inicial</Label><Input name="periodStart" type="date" /></div><div className="space-y-1.5"><Label>Período final</Label><Input name="periodEnd" type="date" /></div></div>
          <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Quantidade</Label><Input name="quantity" type="number" min="0" step="0.0001" /></div><div className="space-y-1.5"><Label>Unidade</Label><Input name="unit" placeholder="UN, h, km" /></div></div>
          <div className="flex items-end justify-end"><SaveButton disabled={isSaving}><Plus className="size-3.5" />Nova medição</SaveButton></div>
        </form>}

        {measurements.length ? <div className="space-y-2">{measurements.map((measurement) => {
          const editable = !isLocked && !["Atestada", "Cancelada"].includes(measurement.status);
          return <details key={measurement.id} className="rounded-md border p-3">
            <summary className="cursor-pointer text-xs font-semibold">Medição {measurement.number} <span className="font-normal text-muted-foreground">· {measurement.status} · {money.format(measurement.valueDecimal)} · {formatDate(measurement.measuredAt)}</span></summary>
            {editable && <form action={(formData) => submit(saveInstrumentMeasurement, formData, "Medição atualizada.")} className="mt-3 grid gap-3 md:grid-cols-3">
              <HiddenInstrumentFields instrument={instrument} />
              <input type="hidden" name="measurementId" value={measurement.id} />
              <div className="space-y-1.5"><Label>Número</Label><Input name="number" required type="number" min="1" step="1" defaultValue={measurement.number} /></div>
               <div className="space-y-1.5"><Label>Situação</Label><select name="status" defaultValue={measurement.status} className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="Rascunho">Rascunho</option><option value="Em análise">Em análise</option><option value="Atestada">Atestada</option><option value="Rejeitada">Rejeitada</option><option value="Cancelada">Cancelada</option></select></div>
               <div className="space-y-1.5"><Label>Data da medição</Label><Input name="measuredAt" required type="date" defaultValue={toDateInput(measurement.measuredAt)} /></div>
               <div className="space-y-1.5"><Label>Documento GED</Label><select name="documentId" defaultValue={measurement.documentId ?? ""} className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Sem documento vinculado</option>{measurement.documentId && !documents.some((document) => document.id === measurement.documentId) && <option value={measurement.documentId}>{measurement.documentTitle ?? "Documento GED vinculado"}</option>}{documents.map((document) => <option key={document.id} value={document.id}>{document.title}</option>)}</select></div>
               <div className="space-y-1.5 md:col-span-3"><Label>Descrição</Label><Input name="description" defaultValue={measurement.description ?? ""} /></div>
               <div className="space-y-1.5 md:col-span-3"><Label>Justificativa do cancelamento</Label><Textarea name="cancellationReason" rows={2} placeholder="Obrigatória ao cancelar; a evidência original será preservada." /></div>
              <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Período inicial</Label><Input name="periodStart" type="date" defaultValue={toDateInput(measurement.periodStart)} /></div><div className="space-y-1.5"><Label>Período final</Label><Input name="periodEnd" type="date" defaultValue={toDateInput(measurement.periodEnd)} /></div></div>
              <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Quantidade</Label><Input name="quantity" type="number" min="0" step="0.0001" defaultValue={measurement.quantity ?? ""} /></div><div className="space-y-1.5"><Label>Unidade</Label><Input name="unit" defaultValue={measurement.unit ?? ""} /></div></div>
              <div className="space-y-1.5"><Label>Valor físico aferido (R$)</Label><Input name="valueDecimal" required type="number" min="0" step="0.01" defaultValue={measurement.valueDecimal} /></div>
              <div className="flex flex-wrap items-end justify-between gap-2 md:col-span-3"><SaveButton disabled={isSaving}>Salvar medição</SaveButton><Button type="button" size="sm" variant="outline" disabled={isSaving || measurement.status !== "Rascunho"} onClick={() => deleteRecord(deleteInstrumentMeasurement, { measurementId: measurement.id }, "Medição em rascunho excluída.", "esta medição em rascunho")}><Trash2 className="size-3.5" />Excluir rascunho</Button></div>
            </form>}
             {measurement.status === "Atestada" && !isLocked && <form action={(formData) => submit(saveInstrumentMeasurement, formData, "Medição cancelada e evidência preservada.")} className="mt-3 space-y-3 rounded-md border border-amber-200 bg-amber-50/60 p-3"><HiddenInstrumentFields instrument={instrument} /><input type="hidden" name="measurementId" value={measurement.id} /><input type="hidden" name="status" value="Cancelada" /><div className="space-y-1.5"><Label>Justificativa do cancelamento</Label><Textarea name="cancellationReason" required rows={2} placeholder="Informe o motivo. A ação só é permitida sem liquidação financeira ativa." /></div><div><SaveButton disabled={isSaving}>Cancelar medição atestada</SaveButton></div></form>}
             {!editable && <div className="mt-3 space-y-1 text-xs text-muted-foreground"><p>Medição {measurement.status.toLocaleLowerCase("pt-BR")} em {formatDate(measurement.measuredAt)}. Seus itens permanecem somente para consulta.</p>{measurement.description && <p className="whitespace-pre-wrap">{measurement.description}</p>}{measurement.documentTitle && <p>Documento GED: {measurement.documentTitle}</p>}</div>}

            <div className="mt-4 space-y-2 border-t pt-3">
              <p className="text-xs font-semibold text-slate-700">Itens da medição</p>
              {measurement.items.length ? measurement.items.map((item) => editable && !item.purchaseReceiptItemLabel ? <form key={item.id} action={(formData) => submit(saveInstrumentMeasurementItem, formData, "Item da medição atualizado.")} className="grid gap-2 rounded-md border bg-slate-50/60 p-2 md:grid-cols-[1.5fr_repeat(4,minmax(0,0.7fr))_auto]">
                <HiddenInstrumentFields instrument={instrument} /><input type="hidden" name="measurementId" value={measurement.id} /><input type="hidden" name="measurementItemId" value={item.id} />
                <Input name="description" required defaultValue={item.description} aria-label="Descrição do item" />
                <Input name="quantity" required type="number" min="0.0001" step="0.0001" defaultValue={item.quantity} aria-label="Quantidade" />
                <Input name="unit" required defaultValue={item.unit} aria-label="Unidade" />
                <Input name="unitValueDecimal" type="number" min="0" step="0.01" defaultValue={item.unitValueDecimal ?? ""} aria-label="Valor unitário" />
                <Input name="valueDecimal" required type="number" min="0" step="0.01" defaultValue={item.valueDecimal} aria-label="Valor total" />
                <div className="flex gap-1"><SaveButton disabled={isSaving}>Salvar</SaveButton><Button type="button" size="sm" variant="outline" disabled={isSaving} onClick={() => deleteRecord(deleteInstrumentMeasurementItem, { measurementId: measurement.id, measurementItemId: item.id }, "Item da medição excluído.", "este item da medição")}><Trash2 className="size-3.5" /></Button></div>
                {instrument.kind === "CONTRACT" && processItems.length ? <select name="purchaseProcessItemId" defaultValue={item.purchaseProcessItemId ?? ""} className="md:col-span-6 flex h-9 w-full rounded-md border bg-background px-3 text-xs"><option value="">Sem vínculo a item do processo</option>{processItems.map((processItem) => <option key={processItem.id} value={processItem.id}>{processItem.label}</option>)}</select> : <input type="hidden" name="purchaseProcessItemId" value={item.purchaseProcessItemId ?? ""} />}
              </form> : <div key={item.id} className="rounded-md border bg-slate-50/60 p-2 text-xs"><div className="flex flex-wrap justify-between gap-2"><span className="font-medium">{item.description}</span><span>{item.quantity} {item.unit} · {money.format(item.valueDecimal)}</span></div>{item.purchaseProcessItemLabel && <p className="mt-1 text-muted-foreground">Item do processo: {item.purchaseProcessItemLabel}</p>}{item.purchaseReceiptItemLabel && <p className="mt-1 text-muted-foreground">Recebimento relacionado: {item.purchaseReceiptItemLabel}</p>}</div>) : <p className="text-xs text-muted-foreground">Nenhum item detalhado.</p>}
              {editable && <form action={(formData) => submit(saveInstrumentMeasurementItem, formData, "Item da medição adicionado.")} className="grid gap-2 rounded-md border border-dashed p-2 md:grid-cols-[1.4fr_repeat(4,minmax(0,0.7fr))_auto]">
                <HiddenInstrumentFields instrument={instrument} /><input type="hidden" name="measurementId" value={measurement.id} />
                <Input name="description" required placeholder="Novo item de execução" aria-label="Descrição do novo item" />
                <Input name="quantity" required type="number" min="0.0001" step="0.0001" placeholder="Qtd." aria-label="Quantidade" />
                <Input name="unit" required placeholder="Un." aria-label="Unidade" />
                <Input name="unitValueDecimal" type="number" min="0" step="0.01" placeholder="Vlr. un." aria-label="Valor unitário" />
                <Input name="valueDecimal" required type="number" min="0" step="0.01" placeholder="Valor" aria-label="Valor total" />
                <SaveButton disabled={isSaving}><Plus className="size-3.5" />Item</SaveButton>
                {instrument.kind === "CONTRACT" && processItems.length ? <select name="purchaseProcessItemId" defaultValue="" className="md:col-span-6 flex h-9 w-full rounded-md border bg-background px-3 text-xs"><option value="">Sem vínculo a item do processo</option>{processItems.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select> : null}
              </form>}
            </div>
          </details>;
        })}</div> : <p className="text-xs text-muted-foreground">Nenhuma medição registrada. Registre a execução física sem criar atos financeiros.</p>}
      </section>

      <section className="space-y-3 border-t pt-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold"><WalletCards className="size-4 text-amber-600" />Parcelas programadas</h2>
          <p className="text-xs text-muted-foreground">O cronograma é administrativo. O sistema não marca parcelas como pagas sem uma vinculação real de pagamento.</p>
        </div>

        {!isLocked && <form action={(formData) => submit(saveInstrumentInstallment, formData, "Parcela programada registrada.")} className="grid gap-3 rounded-md border p-3 md:grid-cols-3">
          <HiddenInstrumentFields instrument={instrument} /><input type="hidden" name="status" value="Programada" />
          <div className="space-y-1.5"><Label>Número</Label><Input name="number" required type="number" min="1" step="1" /></div>
          <div className="space-y-1.5"><Label>Vencimento previsto</Label><Input name="dueDate" required type="date" /></div>
          <div className="space-y-1.5"><Label>Valor programado (R$)</Label><Input name="valueDecimal" required type="number" min="0.01" step="0.01" /></div>
          <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Período inicial</Label><Input name="periodStart" type="date" /></div><div className="space-y-1.5"><Label>Período final</Label><Input name="periodEnd" type="date" /></div></div>
          <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Quantidade</Label><Input name="quantity" type="number" min="0" step="0.0001" /></div><div className="space-y-1.5"><Label>Unidade</Label><Input name="unit" placeholder="UN, h, km" /></div></div>
          <div className="flex items-end justify-end"><SaveButton disabled={isSaving}><Plus className="size-3.5" />Nova parcela</SaveButton></div>
        </form>}

        {installments.length ? <div className="space-y-2">{installments.map((installment) => <details key={installment.id} className="rounded-md border p-3">
          <summary className="cursor-pointer text-xs font-semibold">Parcela {installment.number} <span className="font-normal text-muted-foreground">· {installment.status} · {money.format(installment.valueDecimal)} · vencimento {formatDate(installment.dueDate)}</span></summary>
          {installment.payment ? <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900">Vinculada ao pagamento real {installment.payment.orderNumber} de {formatDate(installment.payment.date)} ({money.format(installment.payment.value)} · {installment.payment.status}). A gestão financeira permanece no módulo próprio.</div> : !isLocked && <form action={(formData) => submit(saveInstrumentInstallment, formData, "Parcela programada atualizada.")} className="mt-3 grid gap-3 md:grid-cols-3">
            <HiddenInstrumentFields instrument={instrument} /><input type="hidden" name="installmentId" value={installment.id} />
            <div className="space-y-1.5"><Label>Número</Label><Input name="number" required type="number" min="1" step="1" defaultValue={installment.number} /></div>
            <div className="space-y-1.5"><Label>Situação</Label><select name="status" defaultValue={installment.status} className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="Programada">Programada</option><option value="Cancelada">Cancelada</option></select></div>
            <div className="space-y-1.5"><Label>Vencimento previsto</Label><Input name="dueDate" required type="date" defaultValue={toDateInput(installment.dueDate)} /></div>
            <div className="space-y-1.5"><Label>Valor programado (R$)</Label><Input name="valueDecimal" required type="number" min="0.01" step="0.01" defaultValue={installment.valueDecimal} /></div>
            <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Período inicial</Label><Input name="periodStart" type="date" defaultValue={toDateInput(installment.periodStart)} /></div><div className="space-y-1.5"><Label>Período final</Label><Input name="periodEnd" type="date" defaultValue={toDateInput(installment.periodEnd)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Quantidade</Label><Input name="quantity" type="number" min="0" step="0.0001" defaultValue={installment.quantity ?? ""} /></div><div className="space-y-1.5"><Label>Unidade</Label><Input name="unit" defaultValue={installment.unit ?? ""} /></div></div>
            <div className="flex flex-wrap items-end justify-between gap-2 md:col-span-3"><SaveButton disabled={isSaving}>Salvar parcela</SaveButton><Button type="button" size="sm" variant="outline" disabled={isSaving} onClick={() => deleteRecord(deleteInstrumentInstallment, { installmentId: installment.id }, "Parcela programada excluída.", "esta parcela programada")}><Trash2 className="size-3.5" />Excluir</Button></div>
          </form>}
        </details>)}</div> : <p className="text-xs text-muted-foreground">Nenhuma parcela programada. O cronograma não representa empenho, liquidação ou pagamento.</p>}
      </section>
    </div>
  );
}
