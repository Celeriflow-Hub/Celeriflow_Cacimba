"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileCheck2, FilePenLine, Printer, Save, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useRef, useState } from "react";
import { generateContractProcurementAuthorizations, saveContractAmendment, updateContractResponsibles } from "./actions";
import type { ContractAmendmentType } from "@/lib/compras/contract-lifecycle";

type Amendment = {
  id: string;
  type: string;
  justification: string;
  previousValue: number | null;
  newValue: number | null;
  previousEndDate: string | null;
  newEndDate: string | null;
  status: string;
  createdAt: string;
};

type LifecycleEvent = {
  id: string;
  eventType: string;
  createdAt: string;
  actorName: string | null;
};

type EmployeeOption = {
  id: string;
  name: string;
  registration: string | null;
  roleName: string | null;
};

type SupplierRepresentative = {
  id: string;
  name: string;
  representationType: string;
};

type ContratoLifecyclePanelProps = {
  contract: {
    id: string;
    status: string;
    startDate: string;
    managerId: string | null;
    inspectorId: string | null;
    supplierName: string;
  };
  employees: EmployeeOption[];
  representatives: SupplierRepresentative[];
  amendments: Amendment[];
  events: LifecycleEvent[];
};

function newIdempotencyKey() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function eventLabel(eventType: string) {
  const labels: Record<string, string> = {
    CONTRACT_AMENDMENT_APPLIED: "Aditivo aplicado",
    CONTRACT_SUSPENSION_REGISTERED: "Suspensão registrada",
    CONTRACT_RESCISSION_REGISTERED: "Rescisão registrada",
    CONTRACT_RESPONSIBLES_UPDATED: "Responsáveis atualizados",
    PURCHASE_RECEIPT_APPROVED: "Recebimento aprovado",
    INSTRUMENT_RESPONSIBILITY_GROUP_CREATED: "Grupo de responsabilidade criado",
    INSTRUMENT_RESPONSIBILITY_GROUP_UPDATED: "Grupo de responsabilidade atualizado",
    INSTRUMENT_RESPONSIBILITY_GROUP_DELETED: "Grupo de responsabilidade excluído",
    INSTRUMENT_PARTY_CREATED: "Parte do instrumento incluída",
    INSTRUMENT_PARTY_UPDATED: "Parte do instrumento atualizada",
    INSTRUMENT_PARTY_DELETED: "Parte do instrumento excluída",
    INSTRUMENT_MEASUREMENT_CREATED: "Medição criada",
    INSTRUMENT_MEASUREMENT_UPDATED: "Medição atualizada",
    INSTRUMENT_MEASUREMENT_CANCELLED: "Medição cancelada",
    INSTRUMENT_MEASUREMENT_DELETED: "Medição excluída",
    INSTRUMENT_MEASUREMENT_ITEM_CREATED: "Item de medição incluído",
    INSTRUMENT_MEASUREMENT_ITEM_UPDATED: "Item de medição atualizado",
    INSTRUMENT_MEASUREMENT_ITEM_DELETED: "Item de medição excluído",
    INSTRUMENT_INSTALLMENT_CREATED: "Parcela programada criada",
    INSTRUMENT_INSTALLMENT_UPDATED: "Parcela programada atualizada",
    INSTRUMENT_INSTALLMENT_DELETED: "Parcela programada excluída",
    PROCUREMENT_EXPENSE_AUTHORIZATION_CREATED: "AE derivada do contrato",
    PROCUREMENT_SUPPLY_AUTHORIZATION_CREATED: "AF gerada",
    PROCUREMENT_SUPPLY_AUTHORIZATION_CANCELLED: "AF anulada",
    PROCUREMENT_LIQUIDATION_AUTHORIZATION_CREATED: "AL gerada",
    PROCUREMENT_LIQUIDATION_AUTHORIZATION_CANCELLED: "AL anulada",
    PROCUREMENT_COMMITMENT_CREATED: "Empenho financeiro confirmado",
    PROCUREMENT_COMMITMENT_CANCELLED: "Empenho financeiro anulado",
    PROCUREMENT_SETTLEMENT_CREATED: "Liquidação financeira confirmada",
    PROCUREMENT_SETTLEMENT_CANCELLED: "Liquidação financeira anulada",
  };
  return labels[eventType] ?? eventType.replaceAll("_", " ");
}

export function ContratoLifecyclePanel({ contract, employees, representatives, amendments, events }: ContratoLifecyclePanelProps) {
  const router = useRouter();
  const amendmentFormRef = useRef<HTMLFormElement>(null);
  const [amendmentType, setAmendmentType] = useState<ContractAmendmentType>("Valor");
  const [amendmentKey, setAmendmentKey] = useState(newIdempotencyKey);
  const [responsibleKey, setResponsibleKey] = useState(newIdempotencyKey);
  const [managerId, setManagerId] = useState(contract.managerId ?? "");
  const [inspectorId, setInspectorId] = useState(contract.inspectorId ?? "");
  const [isSavingAmendment, setIsSavingAmendment] = useState(false);
  const [isSavingResponsibles, setIsSavingResponsibles] = useState(false);
  const [isGeneratingAuthorizations, setIsGeneratingAuthorizations] = useState(false);
  const [amendmentFeedback, setAmendmentFeedback] = useState<string | null>(null);
  const [responsibleFeedback, setResponsibleFeedback] = useState<string | null>(null);
  const [authorizationFeedback, setAuthorizationFeedback] = useState<string | null>(null);
  const changesValue = amendmentType === "Valor" || amendmentType === "Ambos";
  const changesTerm = amendmentType === "Prazo" || amendmentType === "Ambos";
  const managerName = managerId ? employees.find((employee) => employee.id === managerId)?.name ?? "Servidor inativo ou não listado" : "Não designado";
  const inspectorName = inspectorId ? employees.find((employee) => employee.id === inspectorId)?.name ?? "Servidor inativo ou não listado" : "Não designado";

  async function handleAmendment(formData: FormData) {
    setIsSavingAmendment(true);
    setAmendmentFeedback(null);
    formData.set("idempotencyKey", amendmentKey);
    try {
      const result = await saveContractAmendment(formData);
      if (!result.success) {
        setAmendmentFeedback(result.error);
        return;
      }
      amendmentFormRef.current?.reset();
      setAmendmentType("Valor");
      setAmendmentKey(newIdempotencyKey());
      setAmendmentFeedback("Ato contratual registrado no histórico.");
      router.refresh();
    } catch {
      setAmendmentFeedback("Não foi possível registrar o ato contratual. Tente novamente.");
    } finally {
      setIsSavingAmendment(false);
    }
  }

  async function handleResponsibles(formData: FormData) {
    setIsSavingResponsibles(true);
    setResponsibleFeedback(null);
    formData.set("idempotencyKey", responsibleKey);
    try {
      const result = await updateContractResponsibles(formData);
      if (!result.success) {
        setResponsibleFeedback(result.error);
        return;
      }
      setResponsibleKey(newIdempotencyKey());
      setResponsibleFeedback("Responsáveis atualizados no histórico do contrato.");
      router.refresh();
    } catch {
      setResponsibleFeedback("Não foi possível atualizar os responsáveis. Tente novamente.");
    } finally {
      setIsSavingResponsibles(false);
    }
  }

  function handleGenerateAuthorizations() {
    startTransition(async () => {
      setIsGeneratingAuthorizations(true);
      setAuthorizationFeedback(null);
      try {
        const result = await generateContractProcurementAuthorizations(contract.id);
        if (!result.success) {
          setAuthorizationFeedback(result.error);
          return;
        }
        setAuthorizationFeedback("AE derivada por dotação e AF registradas. Empenho, liquidação e pagamento continuam dependentes de atos financeiros reais.");
        router.refresh();
      } catch {
        setAuthorizationFeedback("Não foi possível gerar as autorizações. Tente novamente.");
      } finally {
        setIsGeneratingAuthorizations(false);
      }
    });
  }

  return (
    <div className="space-y-6 text-sm">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold"><UserRound className="size-4 text-indigo-600" />Partes e responsáveis</h2>
            <p className="text-xs text-muted-foreground">Vínculos recuperáveis do contrato, sem presumir assinatura eletrônica.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}><Printer className="size-3.5" />Imprimir razão</Button>
        </div>

        <div className="grid gap-3 rounded-md border p-3 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Fornecedor contratado</p>
            <p>{contract.supplierName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Representantes cadastrados do fornecedor</p>
            {representatives.length ? <div className="space-y-1">{representatives.map((representative) => <p key={representative.id}>{representative.name} <span className="text-muted-foreground">({representative.representationType})</span></p>)}</div> : <p className="text-muted-foreground">Nenhum representante ativo no cadastro do fornecedor.</p>}
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Gestor designado</p>
            <p>{managerName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Fiscal designado</p>
            <p>{inspectorName}</p>
          </div>
        </div>

        <form action={handleResponsibles} className="grid gap-3 rounded-md border p-3 md:grid-cols-2">
          <input type="hidden" name="contractId" value={contract.id} />
          <input type="hidden" name="idempotencyKey" value={responsibleKey} />
          <div className="space-y-2">
            <Label htmlFor="managerId">Gestor do contrato</Label>
            <select id="managerId" name="managerId" value={managerId} onChange={(event) => setManagerId(event.target.value)} className="flex h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Não designado</option>
              {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}{employee.registration ? ` · ${employee.registration}` : ""}{employee.roleName ? ` · ${employee.roleName}` : ""}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="inspectorId">Fiscal do contrato</Label>
            <select id="inspectorId" name="inspectorId" value={inspectorId} onChange={(event) => setInspectorId(event.target.value)} className="flex h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Não designado</option>
              {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}{employee.registration ? ` · ${employee.registration}` : ""}{employee.roleName ? ` · ${employee.roleName}` : ""}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">Gestor e fiscal são os vínculos legados do contrato. Demais grupos, partes e designações são registrados na seção de execução do instrumento.</p>
            <Button type="submit" size="sm" disabled={isSavingResponsibles}><Save className="size-3.5" />{isSavingResponsibles ? "Salvando..." : "Salvar responsáveis"}</Button>
          </div>
          {responsibleFeedback && <p className="md:col-span-2 text-xs text-muted-foreground" role="status">{responsibleFeedback}</p>}
        </form>
      </section>

      <section className="space-y-3 border-t pt-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold"><FileCheck2 className="size-4 text-emerald-600" />Autorizações de fornecimento</h2>
          <p className="text-xs text-muted-foreground">Gera AE por dotação e AF a partir do contrato vigente. Não emite empenho, liquidação ou pagamento.</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
          <p className="text-xs text-muted-foreground">A repetição usa as mesmas chaves de origem e não cria outra AE ou AF.</p>
          <Button type="button" size="sm" disabled={contract.status !== "Vigente" || isGeneratingAuthorizations} onClick={handleGenerateAuthorizations}><FileCheck2 className="size-3.5" />{isGeneratingAuthorizations ? "Gerando..." : "Gerar AE e AF"}</Button>
        </div>
        {contract.status !== "Vigente" && <p className="text-xs text-amber-700">A geração exige contrato vigente.</p>}
        {authorizationFeedback && <p className="text-xs text-muted-foreground" role="status">{authorizationFeedback}</p>}
      </section>

      <section className="space-y-3 border-t pt-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold"><FilePenLine className="size-4 text-indigo-600" />Aditivos e atos contratuais</h2>
          <p className="text-xs text-muted-foreground">O motivo e o momento de registro são mantidos no histórico; suspensão e rescisão não removem o instrumento.</p>
        </div>

        <form ref={amendmentFormRef} action={handleAmendment} className="grid gap-3 rounded-md border p-3 md:grid-cols-2">
          <input type="hidden" name="contractId" value={contract.id} />
          <input type="hidden" name="idempotencyKey" value={amendmentKey} />
          <div className="space-y-2">
            <Label htmlFor="amendmentType">Tipo do ato</Label>
            <select id="amendmentType" name="type" value={amendmentType} onChange={(event) => setAmendmentType(event.target.value as ContractAmendmentType)} className="flex h-9 w-full rounded-md border bg-background px-3 text-sm" disabled={contract.status === "Rescindido"}>
              <option value="Valor">Aditivo de valor</option>
              <option value="Prazo">Aditivo de prazo</option>
              <option value="Ambos">Aditivo de valor e prazo</option>
              <option value="Suspensão">Suspensão</option>
              <option value="Rescisão">Rescisão</option>
            </select>
          </div>
          {changesValue && <div className="space-y-2">
            <Label htmlFor="newValue">Novo valor total (R$)</Label>
            <Input id="newValue" name="newValue" type="number" min="0" step="0.01" required disabled={contract.status === "Rescindido"} />
          </div>}
          {changesTerm && <div className="space-y-2">
            <Label htmlFor="newEndDate">Nova data final</Label>
            <Input id="newEndDate" name="newEndDate" type="date" min={contract.startDate.slice(0, 10)} required disabled={contract.status === "Rescindido"} />
          </div>}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="justification">Motivo / justificativa</Label>
            <Textarea id="justification" name="justification" required rows={3} disabled={contract.status === "Rescindido"} />
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">Não cria empenho, liquidação ou pagamento. Um ato aplicado preserva o valor e prazo anteriores.</p>
            <Button type="submit" size="sm" disabled={isSavingAmendment || contract.status === "Rescindido"}><Save className="size-3.5" />{isSavingAmendment ? "Registrando..." : "Registrar ato"}</Button>
          </div>
          {amendmentFeedback && <p className="md:col-span-2 text-xs text-muted-foreground" role="status">{amendmentFeedback}</p>}
        </form>

        {amendments.length ? <div className="space-y-2">{amendments.map((amendment) => <details key={amendment.id} className="rounded-md border p-3">
          <summary className="cursor-pointer font-medium">{amendment.type} · {amendment.status} · {formatDate(amendment.createdAt)}</summary>
          <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
            <p className="md:col-span-2"><span className="font-medium">Motivo:</span> {amendment.justification}</p>
            {amendment.previousValue !== null && <p><span className="font-medium">Valor anterior:</span> {formatMoney(amendment.previousValue)}</p>}
            {amendment.newValue !== null && <p><span className="font-medium">Novo valor:</span> {formatMoney(amendment.newValue)}</p>}
            {amendment.previousEndDate && <p><span className="font-medium">Término anterior:</span> {formatDate(amendment.previousEndDate)}</p>}
            {amendment.newEndDate && <p><span className="font-medium">Novo término:</span> {formatDate(amendment.newEndDate)}</p>}
          </div>
        </details>)}</div> : <p className="text-sm text-muted-foreground">Nenhum aditivo, suspensão ou rescisão registrado.</p>}
      </section>

      <section className="space-y-3 border-t pt-4">
        <div>
          <h2 className="text-sm font-semibold">Trilha de auditoria</h2>
          <p className="text-xs text-muted-foreground">Eventos append-only do ciclo de compras vinculados ao contrato.</p>
        </div>
        {events.length ? <div className="space-y-2">{events.map((event) => <div key={event.id} className="flex flex-wrap justify-between gap-2 rounded-md border p-3 text-xs"><span className="font-medium">{eventLabel(event.eventType)}</span><span>{event.actorName ?? "Usuário não informado"}</span><span className="text-muted-foreground">{formatDateTime(event.createdAt)}</span></div>)}</div> : <p className="text-sm text-muted-foreground">Nenhum evento de compras registrado para este contrato.</p>}
      </section>
    </div>
  );
}
