"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ClipboardCheck, FilePlus2, Gavel, Landmark, Plus, UserRoundCheck, UsersRound } from "lucide-react";
import {
  BIDDING_BID_STATUS,
  BIDDING_ELIGIBILITY_STATUS,
  BIDDING_PHASE_STATUS,
  canConfigureBiddingLots,
  canDecideBiddingEligibility,
  canDecideBiddingResult,
  canRegisterBiddingParticipant,
} from "@/lib/compras/bidding-workflow";
import {
  addBiddingParticipant,
  assignBiddingAppointment,
  createBiddingAppointment,
  createBiddingLot,
  decideBiddingEligibility,
  decideBiddingResult,
  endBiddingAppointmentAssignment,
  initializeBiddingWorkflow,
  registerBiddingAct,
  saveSupplierPortalIdentity,
  type BiddingActionResult,
} from "./actions";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

type Employee = {
  id: string;
  name: string;
  role: string | null;
};

type Supplier = {
  id: string;
  name: string;
};

type User = {
  id: string;
  name: string;
  email: string;
};

type Appointment = {
  id: string;
  kind: string;
  name: string;
  status: string;
  assignedAt: string;
  role: string | null;
  members: Array<{ id: string; employeeName: string; role: string; status: string }>;
};

type Phase = {
  id: string;
  code: string;
  name: string;
  sequence: number;
  status: string;
  isCurrent: boolean;
  startedAt: string | null;
  completedAt: string | null;
};

type Participant = {
  id: string;
  supplierId: string;
  supplierName: string;
  displayCode: string | null;
  status: string;
  registeredAt: string;
  notes: string | null;
};

type PortalIdentity = {
  id: string;
  supplierId: string;
  usuarioId: string;
  userName: string;
  userEmail: string;
  status: string;
};

type Lot = {
  id: string;
  number: number;
  description: string | null;
  status: string;
  estimatedValue: string | null;
  items: Array<{ id: string; label: string; quantity: number; unit: string }>;
  eligibility: Array<{ id: string; participantId: string; status: string; reason: string | null; decidedAt: string }>;
  bids: Array<{
    id: string;
    participantId: string;
    participantLabel: string;
    sequence: number;
    status: string;
    totalValue: string;
    unitValue: string | null;
    submittedAt: string;
  }>;
  result: {
    id: string;
    participantLabel: string;
    status: string;
    totalValue: string;
    decidedAt: string;
  } | null;
};

type Act = {
  id: string;
  type: string;
  description: string | null;
  occurredAt: string;
  phaseName: string | null;
  lotNumber: number | null;
  actorName: string;
};

type ProcessItem = {
  id: string;
  label: string;
  unit: string;
  quantity: number;
  estimatedUnitValue: number | null;
};

type BiddingWorkflowPanelProps = {
  biddingId: string;
  biddingStatus: string;
  canUpdate: boolean;
  workflowInitialized: boolean;
  phases: Phase[];
  appointments: Appointment[];
  availableAppointments: Appointment[];
  employees: Employee[];
  suppliers: Supplier[];
  users: User[];
  participants: Participant[];
  portalIdentities: PortalIdentity[];
  processItems: ProcessItem[];
  lots: Lot[];
  acts: Act[];
};

function money(value: string | null) {
  return value === null ? "Não informado" : currency.format(Number(value));
}

function date(value: string) {
  return dateTime.format(new Date(value));
}

function newIdempotencyKey() {
  return typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function BiddingWorkflowPanel({
  biddingId,
  biddingStatus,
  canUpdate,
  workflowInitialized,
  phases,
  appointments,
  availableAppointments,
  employees,
  suppliers,
  users,
  participants,
  portalIdentities,
  processItems,
  lots,
  acts,
}: BiddingWorkflowPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [members, setMembers] = useState([{ employeeId: "", role: "Membro" }]);
  const [selectedLotItems, setSelectedLotItems] = useState<Record<string, string>>({});
  const [eligibilityLotId, setEligibilityLotId] = useState(lots[0]?.id ?? "");
  const [resultLotId, setResultLotId] = useState(lots[0]?.id ?? "");
  const [existingAppointmentId, setExistingAppointmentId] = useState("");

  const assignedItemIds = new Set(lots.flatMap((lot) => lot.items.map((item) => item.id)));
  const availableProcessItems = processItems.filter((item) => !assignedItemIds.has(item.id));
  const selectedResultLot = lots.find((lot) => lot.id === resultLotId) ?? null;
  const selectedEligibilityLot = lots.find((lot) => lot.id === eligibilityLotId) ?? null;
  const setupOpen = canConfigureBiddingLots(biddingStatus);
  const participantsOpen = canRegisterBiddingParticipant(biddingStatus);
  const eligibilityOpen = canDecideBiddingEligibility(biddingStatus);
  const resultOpen = canDecideBiddingResult(biddingStatus);

  function run(action: () => Promise<BiddingActionResult>, message: string, onSuccess?: () => void) {
    setError("");
    setNotice("");
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.success) {
          setError(result.error);
          return;
        }
        onSuccess?.();
        setNotice(message);
        router.refresh();
      } catch {
        setError("Não foi possível concluir a operação. Atualize a página e tente novamente.");
      }
    });
  }

  function submitAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    run(
      () => createBiddingAppointment({
        biddingId,
        kind: String(formData.get("kind") || ""),
        name: String(formData.get("name") || ""),
        role: String(formData.get("assignmentRole") || ""),
        appointedAt: String(formData.get("appointedAt") || ""),
        endsAt: String(formData.get("endsAt") || ""),
        notes: String(formData.get("notes") || ""),
        members,
      }),
      "Designação registrada e vinculada ao certame.",
      () => {
        form.reset();
        setMembers([{ employeeId: "", role: "Membro" }]);
      },
    );
  }

  function submitExistingAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    run(
      () => assignBiddingAppointment({
        biddingId,
        appointmentId: existingAppointmentId,
        role: String(formData.get("existingAssignmentRole") || ""),
      }),
      "Designação vinculada ao certame.",
      () => {
        form.reset();
        setExistingAppointmentId("");
      },
    );
  }

  function submitLot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const items = Object.entries(selectedLotItems).map(([purchaseProcessItemId, quantity]) => ({
      purchaseProcessItemId,
      quantity: Number(quantity),
    }));
    run(
      () => createBiddingLot({
        biddingId,
        description: String(formData.get("lotDescription") || ""),
        items,
      }),
      "Lote criado com os itens selecionados.",
      () => {
        form.reset();
        setSelectedLotItems({});
      },
    );
  }

  function submitParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    run(
      () => addBiddingParticipant({
        biddingId,
        supplierId: String(formData.get("supplierId") || ""),
        displayCode: String(formData.get("displayCode") || ""),
        notes: String(formData.get("participantNotes") || ""),
      }),
      "Participante registrado no certame.",
      () => form.reset(),
    );
  }

  function submitPortalIdentity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    run(
      () => saveSupplierPortalIdentity({
        biddingId,
        supplierId: String(formData.get("portalSupplierId") || ""),
        usuarioId: String(formData.get("usuarioId") || ""),
      }),
      "Acesso autenticado do fornecedor foi liberado.",
      () => form.reset(),
    );
  }

  function submitEligibility(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    run(
      () => decideBiddingEligibility({
        biddingId,
        biddingLotId: eligibilityLotId,
        participantId: String(formData.get("eligibilityParticipantId") || ""),
        status: String(formData.get("eligibilityStatus") || ""),
        reason: String(formData.get("eligibilityReason") || ""),
        idempotencyKey: newIdempotencyKey(),
      }),
      "Decisão de habilitação registrada.",
      () => form.reset(),
    );
  }

  function submitResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    run(
      () => decideBiddingResult({
        biddingId,
        biddingLotId: resultLotId,
        biddingBidId: String(formData.get("biddingBidId") || ""),
        idempotencyKey: newIdempotencyKey(),
      }),
      "Arrematação registrada para o lote.",
    );
  }

  function submitAct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    run(
      () => registerBiddingAct({
        biddingId,
        type: String(formData.get("actType") || ""),
        description: String(formData.get("actDescription") || ""),
        phaseId: String(formData.get("actPhaseId") || ""),
        biddingLotId: String(formData.get("actLotId") || ""),
      }),
      "Ato registrado no histórico do certame.",
      () => form.reset(),
    );
  }

  return (
    <div className="space-y-2">
      {error ? <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
      {notice ? <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{notice}</p> : null}

      <Card className="rounded-md">
        <CardHeader className="border-b p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm"><Gavel className="size-4 text-amber-600" />Fases persistidas</CardTitle>
              <CardDescription className="text-xs">Cada mudança de situação atualiza a fase corrente e mantém os atos do certame auditáveis.</CardDescription>
            </div>
            {canUpdate && !workflowInitialized ? <Button size="sm" type="button" disabled={pending} onClick={() => run(() => initializeBiddingWorkflow(biddingId), "Fases persistidas foram inicializadas.")}>Inicializar fases</Button> : null}
          </div>
        </CardHeader>
        <CardContent className="p-3">
          {phases.length ? (
            <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
              {phases.map((phase) => {
                const completed = phase.status === BIDDING_PHASE_STATUS.COMPLETED;
                const current = phase.isCurrent;
                return <li key={phase.id} className={`rounded-md border p-3 text-sm ${completed ? "border-emerald-300 bg-emerald-50 text-emerald-950" : current ? "border-amber-300 bg-amber-50 text-amber-950" : "bg-muted/30 text-muted-foreground"}`}><p className="font-semibold">{phase.sequence}. {phase.name}</p><p className="mt-1 text-xs">{phase.status}</p>{phase.completedAt ? <p className="mt-1 text-xs">Concluída em {date(phase.completedAt)}</p> : null}</li>;
              })}
            </ol>
          ) : <p className="text-sm text-muted-foreground">Esta licitação é anterior ao workflow persistido. Inicialize as fases para registrar o estado atual.</p>}
        </CardContent>
      </Card>

      <div className="grid gap-2 xl:grid-cols-2">
        <Card className="rounded-md">
          <CardHeader className="border-b p-3"><CardTitle className="flex items-center gap-2 text-sm"><UsersRound className="size-4 text-sky-600" />Comissão e designações</CardTitle><CardDescription className="text-xs">Crie uma comissão, equipe ou agente e vincule seus servidores ao certame.</CardDescription></CardHeader>
          <CardContent className="space-y-3 p-3">
            {appointments.length ? <div className="space-y-2">{appointments.map((appointment) => <article key={appointment.id} className="rounded-md border p-3 text-sm"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{appointment.name}</p><p className="text-xs text-muted-foreground">{appointment.kind}{appointment.role ? ` · ${appointment.role}` : ""}</p></div><div className="flex items-center gap-2"><Badge variant="secondary">{appointment.status}</Badge>{canUpdate && appointment.status === "Ativa" ? <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => { if (window.confirm(`Encerrar a vinculação de ${appointment.name}?`)) run(() => endBiddingAppointmentAssignment({ biddingId, assignmentId: appointment.id }), "Vínculo de designação encerrado."); }}>Encerrar</Button> : null}</div></div><p className="mt-2 text-xs text-muted-foreground">{appointment.members.map((member) => `${member.employeeName} (${member.role})`).join(" · ") || "Sem membros ativos"}</p></article>)}</div> : <p className="text-sm text-muted-foreground">Nenhuma comissão ou agente foi vinculado.</p>}
            {canUpdate ? <details className="rounded-md border p-3" open={!appointments.length}><summary className="cursor-pointer text-sm font-semibold">Nova designação</summary><form className="mt-3 space-y-3" onSubmit={submitAppointment}><fieldset disabled={pending} className="space-y-3"><div className="grid gap-2 sm:grid-cols-2"><label className="space-y-1 text-sm"><span>Tipo</span><select name="kind" required defaultValue="Comissão de contratação" className="h-9 w-full rounded-md border bg-background px-2"><option>Comissão de contratação</option><option>Agente de contratação</option><option>Pregoeiro e equipe de apoio</option><option>Comissão especial</option><option>Leiloeiro</option></select></label><label className="space-y-1 text-sm"><span>Nome</span><Input name="name" required placeholder="Ex.: Comissão Permanente 2026" /></label></div><div className="grid gap-2 sm:grid-cols-3"><label className="space-y-1 text-sm"><span>Função no certame</span><Input name="assignmentRole" placeholder="Ex.: Comissão responsável" /></label><label className="space-y-1 text-sm"><span>Designada em</span><Input name="appointedAt" type="date" /></label><label className="space-y-1 text-sm"><span>Vigência final</span><Input name="endsAt" type="date" /></label></div><div className="space-y-2"><p className="text-sm font-medium">Membros</p>{members.map((member, index) => <div key={`${index}-${member.employeeId}`} className="grid gap-2 sm:grid-cols-[1fr_160px_auto]"><select required value={member.employeeId} onChange={(event) => setMembers((current) => current.map((item, memberIndex) => memberIndex === index ? { ...item, employeeId: event.target.value } : item))} className="h-9 rounded-md border bg-background px-2"><option value="">Selecione o servidor</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}{employee.role ? ` · ${employee.role}` : ""}</option>)}</select><Input required value={member.role} onChange={(event) => setMembers((current) => current.map((item, memberIndex) => memberIndex === index ? { ...item, role: event.target.value } : item))} placeholder="Função" />{members.length > 1 ? <Button type="button" variant="outline" onClick={() => setMembers((current) => current.filter((_, memberIndex) => memberIndex !== index))}>Remover</Button> : <span />}</div>)}<Button type="button" variant="outline" size="sm" onClick={() => setMembers((current) => [...current, { employeeId: "", role: "Membro" }])}><Plus className="size-3.5" />Adicionar membro</Button></div><label className="space-y-1 text-sm"><span>Observações</span><Textarea name="notes" placeholder="Portaria, composição ou observações relevantes." /></label><Button type="submit">Salvar designação</Button></fieldset></form></details> : null}
            {canUpdate && availableAppointments.length ? <details className="rounded-md border p-3"><summary className="cursor-pointer text-sm font-semibold">Vincular designação existente</summary><form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={submitExistingAppointment}><select required value={existingAppointmentId} onChange={(event) => setExistingAppointmentId(event.target.value)} className="h-9 min-w-0 flex-1 rounded-md border bg-background px-2"><option value="">Selecione uma designação ativa</option>{availableAppointments.map((appointment) => <option key={appointment.id} value={appointment.id}>{appointment.name} · {appointment.kind}</option>)}</select><Input name="existingAssignmentRole" className="sm:max-w-48" placeholder="Função no certame" /><Button type="submit" disabled={pending || !existingAppointmentId}>Vincular</Button></form></details> : null}
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader className="border-b p-3"><CardTitle className="flex items-center gap-2 text-sm"><Landmark className="size-4 text-violet-600" />Lotes e itens</CardTitle><CardDescription className="text-xs">Os itens do processo são agrupados em lotes antes da publicação.</CardDescription></CardHeader>
          <CardContent className="space-y-3 p-3">
            {lots.length ? <div className="space-y-2">{lots.map((lot) => <article key={lot.id} className="rounded-md border p-3 text-sm"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">Lote {lot.number}{lot.description ? ` · ${lot.description}` : ""}</p><p className="text-xs text-muted-foreground">{lot.items.length} item(ns) · Estimado {money(lot.estimatedValue)}</p></div><Badge variant="secondary">{lot.status}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{lot.items.map((item) => `${item.label}: ${item.quantity} ${item.unit}`).join(" · ")}</p>{lot.result ? <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-800"><CheckCircle2 className="size-3.5" />{lot.result.status}: {lot.result.participantLabel} por {money(lot.result.totalValue)}</p> : null}</article>)}</div> : <p className="text-sm text-muted-foreground">Nenhum lote foi criado.</p>}
            {canUpdate && setupOpen ? <details className="rounded-md border p-3" open={!lots.length}><summary className="cursor-pointer text-sm font-semibold">Criar lote</summary>{availableProcessItems.length ? <form className="mt-3 space-y-3" onSubmit={submitLot}><fieldset disabled={pending} className="space-y-3"><label className="space-y-1 text-sm"><span>Descrição do lote</span><Input name="lotDescription" placeholder="Ex.: Material de expediente" /></label><div className="space-y-2"><p className="text-sm font-medium">Itens disponíveis do processo</p>{availableProcessItems.map((item) => { const selected = Object.prototype.hasOwnProperty.call(selectedLotItems, item.id); return <div key={item.id} className="grid gap-2 rounded-md border p-2 sm:grid-cols-[auto_1fr_130px]"><label className="flex items-center"><input type="checkbox" checked={selected} onChange={(event) => setSelectedLotItems((current) => { const next = { ...current }; if (event.target.checked) next[item.id] = String(item.quantity); else delete next[item.id]; return next; })} /></label><div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">Disponível: {item.quantity} {item.unit} · {currency.format(item.estimatedUnitValue ?? 0)} unitário</p></div><Input type="number" min="0.0001" max={item.quantity} step="any" disabled={!selected} value={selectedLotItems[item.id] ?? ""} onChange={(event) => setSelectedLotItems((current) => ({ ...current, [item.id]: event.target.value }))} aria-label={`Quantidade de ${item.label}`} /></div>; })}</div><Button type="submit" disabled={!Object.keys(selectedLotItems).length}>Criar lote</Button></fieldset></form> : <p className="mt-3 text-sm text-muted-foreground">Todos os itens do processo já estão agrupados em lotes.</p>}</details> : null}
            {!setupOpen ? <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">A composição dos lotes é bloqueada depois da elaboração para preservar a disputa.</p> : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-2 xl:grid-cols-2">
        <Card className="rounded-md">
          <CardHeader className="border-b p-3"><CardTitle className="flex items-center gap-2 text-sm"><UserRoundCheck className="size-4 text-emerald-700" />Participantes e portal</CardTitle><CardDescription className="text-xs">O portal identifica o usuário autenticado e só libera lances do fornecedor vinculado.</CardDescription></CardHeader>
          <CardContent className="space-y-3 p-3">
            {participants.length ? <div className="space-y-2">{participants.map((participant) => { const identities = portalIdentities.filter((identity) => identity.supplierId === participant.supplierId); return <article key={participant.id} className="rounded-md border p-3 text-sm"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{participant.supplierName}</p><p className="text-xs text-muted-foreground">{participant.displayCode || "Sem código público"} · {participant.status}</p></div><Badge variant="outline">{identities.length ? `${identities.length} acesso(s)` : "Sem acesso"}</Badge></div>{identities.length ? <p className="mt-2 text-xs text-muted-foreground">{identities.map((identity) => `${identity.userName} (${identity.userEmail})`).join(" · ")}</p> : null}</article>; })}</div> : <p className="text-sm text-muted-foreground">Nenhum fornecedor foi registrado como participante.</p>}
            {canUpdate && participantsOpen ? <details className="rounded-md border p-3" open={!participants.length}><summary className="cursor-pointer text-sm font-semibold">Registrar participante</summary><form className="mt-3 space-y-2" onSubmit={submitParticipant}><fieldset disabled={pending} className="grid gap-2 sm:grid-cols-2"><select name="supplierId" required className="h-9 rounded-md border bg-background px-2"><option value="">Selecione o fornecedor ativo</option>{suppliers.filter((supplier) => !participants.some((participant) => participant.supplierId === supplier.id)).map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select><Input name="displayCode" placeholder="Código público opcional" /><Textarea name="participantNotes" className="sm:col-span-2" placeholder="Observações do credenciamento" /><Button type="submit" className="sm:w-fit">Registrar</Button></fieldset></form></details> : null}
            {canUpdate && participants.length ? <details className="rounded-md border p-3"><summary className="cursor-pointer text-sm font-semibold">Liberar acesso ao portal</summary><form className="mt-3 grid gap-2 sm:grid-cols-2" onSubmit={submitPortalIdentity}><select name="portalSupplierId" required className="h-9 rounded-md border bg-background px-2"><option value="">Fornecedor participante</option>{participants.map((participant) => <option key={participant.id} value={participant.supplierId}>{participant.supplierName}</option>)}</select><select name="usuarioId" required className="h-9 rounded-md border bg-background px-2"><option value="">Usuário autenticado</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.email}</option>)}</select><Button type="submit" className="sm:w-fit" disabled={pending}>Liberar acesso</Button></form></details> : null}
            {!participantsOpen ? <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">Novos participantes são bloqueados depois da abertura da disputa.</p> : null}
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader className="border-b p-3"><CardTitle className="flex items-center gap-2 text-sm"><ClipboardCheck className="size-4 text-sky-700" />Habilitação por lote</CardTitle><CardDescription className="text-xs">A última decisão por participante e lote é aplicada pelo portal antes de aceitar um lance.</CardDescription></CardHeader>
          <CardContent className="space-y-3 p-3">
            {lots.length && participants.length ? <div className="space-y-2">{lots.map((lot) => <article key={lot.id} className="rounded-md border p-3 text-sm"><p className="font-semibold">Lote {lot.number}</p><div className="mt-2 grid gap-1 sm:grid-cols-2">{participants.map((participant) => { const current = lot.eligibility.find((decision) => decision.participantId === participant.id); return <p key={participant.id} className="text-xs text-muted-foreground">{participant.displayCode || participant.supplierName}: <span className="font-medium text-foreground">{current?.status || "Sem decisão"}</span>{current?.reason ? ` · ${current.reason}` : ""}</p>; })}</div></article>)}</div> : <p className="text-sm text-muted-foreground">Registre participantes e lotes para decidir a habilitação.</p>}
            {canUpdate && eligibilityOpen && lots.length && participants.length ? <form className="rounded-md border p-3" onSubmit={submitEligibility}><fieldset disabled={pending} className="grid gap-2 sm:grid-cols-2"><label className="space-y-1 text-sm"><span>Lote</span><select value={eligibilityLotId} onChange={(event) => setEligibilityLotId(event.target.value)} required className="h-9 w-full rounded-md border bg-background px-2">{lots.map((lot) => <option key={lot.id} value={lot.id}>Lote {lot.number}</option>)}</select></label><label className="space-y-1 text-sm"><span>Participante</span><select name="eligibilityParticipantId" required className="h-9 w-full rounded-md border bg-background px-2"><option value="">Selecione</option>{participants.map((participant) => <option key={participant.id} value={participant.id}>{participant.displayCode || participant.supplierName}</option>)}</select></label><label className="space-y-1 text-sm"><span>Decisão</span><select name="eligibilityStatus" defaultValue={BIDDING_ELIGIBILITY_STATUS.ELIGIBLE} className="h-9 w-full rounded-md border bg-background px-2"><option value={BIDDING_ELIGIBILITY_STATUS.ELIGIBLE}>Habilitado</option><option value={BIDDING_ELIGIBILITY_STATUS.INELIGIBLE}>Inabilitado</option></select></label><label className="space-y-1 text-sm"><span>Motivo</span><Input name="eligibilityReason" placeholder="Opcional" /></label><Button type="submit" className="sm:w-fit" disabled={!selectedEligibilityLot}>Registrar decisão</Button></fieldset></form> : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-2 xl:grid-cols-2">
        <Card className="rounded-md">
          <CardHeader className="border-b p-3"><CardTitle className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-700" />Lances e arrematação</CardTitle><CardDescription className="text-xs">A arrematação exige lance aceito e habilitação vigente do participante.</CardDescription></CardHeader>
          <CardContent className="space-y-3 p-3">
            {lots.length ? <div className="space-y-2">{lots.map((lot) => <article key={lot.id} className="rounded-md border p-3 text-sm"><div className="flex items-center justify-between gap-2"><p className="font-semibold">Lote {lot.number}</p><Badge variant="secondary">{lot.bids.length} lance(s)</Badge></div>{lot.bids.length ? <div className="mt-2 space-y-1">{lot.bids.map((bid) => <p key={bid.id} className="text-xs text-muted-foreground">#{bid.sequence} · {bid.participantLabel} · {money(bid.totalValue)} · {bid.status} · {date(bid.submittedAt)}</p>)}</div> : <p className="mt-2 text-xs text-muted-foreground">Nenhum lance apresentado.</p>}</article>)}</div> : <p className="text-sm text-muted-foreground">Nenhum lote disponível para julgamento.</p>}
            {canUpdate && resultOpen && lots.length ? <form className="rounded-md border p-3" onSubmit={submitResult}><fieldset disabled={pending} className="grid gap-2 sm:grid-cols-2"><label className="space-y-1 text-sm"><span>Lote</span><select value={resultLotId} onChange={(event) => setResultLotId(event.target.value)} className="h-9 w-full rounded-md border bg-background px-2">{lots.map((lot) => <option key={lot.id} value={lot.id}>Lote {lot.number}</option>)}</select></label><label className="space-y-1 text-sm"><span>Lance vencedor</span><select name="biddingBidId" required className="h-9 w-full rounded-md border bg-background px-2"><option value="">Selecione</option>{selectedResultLot?.bids.filter((bid) => bid.status === BIDDING_BID_STATUS.ACCEPTED).map((bid) => <option key={bid.id} value={bid.id}>#{bid.sequence} · {bid.participantLabel} · {money(bid.totalValue)}</option>)}</select></label><Button type="submit" className="sm:w-fit" disabled={!selectedResultLot?.bids.length}>Registrar arrematação</Button></fieldset></form> : null}
            {!resultOpen && biddingStatus === "Em Julgamento" ? <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">O julgamento está indisponível para seu perfil.</p> : null}
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader className="border-b p-3"><CardTitle className="flex items-center gap-2 text-sm"><FilePlus2 className="size-4 text-amber-700" />Atos do certame</CardTitle><CardDescription className="text-xs">Registre atas, comunicações e demais atos com fase, lote e responsável.</CardDescription></CardHeader>
          <CardContent className="space-y-3 p-3">
            {acts.length ? <div className="max-h-80 space-y-2 overflow-auto pr-1">{acts.map((act) => <article key={act.id} className="rounded-md border p-3 text-sm"><div className="flex flex-wrap items-start justify-between gap-2"><p className="font-semibold">{act.type}</p><time className="text-xs text-muted-foreground">{date(act.occurredAt)}</time></div>{act.description ? <p className="mt-1 text-sm">{act.description}</p> : null}<p className="mt-1 text-xs text-muted-foreground">{act.phaseName || "Sem fase"}{act.lotNumber ? ` · Lote ${act.lotNumber}` : ""} · Por {act.actorName}</p></article>)}</div> : <p className="text-sm text-muted-foreground">Nenhum ato registrado.</p>}
            {canUpdate ? <form className="rounded-md border p-3" onSubmit={submitAct}><fieldset disabled={pending} className="space-y-2"><div className="grid gap-2 sm:grid-cols-2"><Input name="actType" required placeholder="Tipo do ato" /><select name="actPhaseId" className="h-9 rounded-md border bg-background px-2"><option value="">Sem fase específica</option>{phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.sequence}. {phase.name}</option>)}</select></div><select name="actLotId" className="h-9 w-full rounded-md border bg-background px-2"><option value="">Sem lote específico</option>{lots.map((lot) => <option key={lot.id} value={lot.id}>Lote {lot.number}</option>)}</select><Textarea name="actDescription" placeholder="Descrição, número da ata ou observações." /><Button type="submit">Registrar ato</Button></fieldset></form> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
