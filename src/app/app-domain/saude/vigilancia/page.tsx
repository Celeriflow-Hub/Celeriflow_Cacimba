import { ShieldCheck } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { HealthSimpleListClient } from "../HealthSimpleListClient";
import { issueLicenseAction, saveComplaintAction, saveEstablishmentAction, saveInspectionAction, transitionComplaintAction, transitionInspectionAction, transitionLicenseAction } from "./actions";
import type { Prisma } from "@prisma/client";

const field = "h-8 min-w-0 rounded border border-slate-200 bg-white px-2 text-xs";
const PAGE_SIZE = 20;
type Params = { q?: string | string[]; filter?: string | string[]; page?: string | string[] };
const first = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : v;
const num = (v: string | undefined) => v && /^\d+$/.test(v) && Number(v) > 0 ? Number(v) : 1;

export default async function VigilanciaPage({ searchParams }: { searchParams: Promise<Params> }) {
  const context = await getTenantContextForModule("SAUDE");
  const { prisma } = context;
  const params = await searchParams;
  const q = (first(params.q) || "").trim().slice(0, 120);
  const filter = (first(params.filter) || "").trim().slice(0, 40);
  const where: Prisma.HealthVigilanceEstablishmentWhereInput = {
    ...(filter ? { status: filter } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { document: { contains: q, mode: "insensitive" } }, { cnae: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const total = await prisma.healthVigilanceEstablishment.count({ where });
  const page = Math.min(num(first(params.page)), Math.max(1, Math.ceil(total / PAGE_SIZE)));
  const [establishments, complaints, inspections, licenses, professionals, patients] = await Promise.all([
    prisma.healthVigilanceEstablishment.findMany({ where, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, orderBy: { name: "asc" }, include: { licenses: { where: { status: "Válido" }, take: 1, select: { licenseNumber: true, validUntil: true } } } }),
    prisma.healthVigilanceComplaint.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { establishment: { select: { name: true } } } }),
    prisma.healthVigilanceInspection.findMany({ orderBy: { inspectedAt: "desc" }, take: 100, include: { establishment: { select: { name: true } }, items: true } }),
    prisma.healthVigilanceLicense.findMany({ orderBy: { validUntil: "desc" }, take: 100, include: { establishment: { select: { name: true } } } }),
    prisma.healthProfessional.findMany({ where: { isActive: true }, take: 200, select: { id: true } }),
    prisma.patient.findMany({ where: { status: "Ativo" }, take: 200, orderBy: { person: { fullName: "asc" } }, select: { personId: true, person: { select: { fullName: true } } } }),
  ]);

  return (
    <PageFrame className="flex h-[calc(100dvh-7.5rem)] min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title="Vigilância em Saúde" icon={<ShieldCheck className="size-4 text-rose-700" />} />
      <div className="grid shrink-0 gap-2 lg:grid-cols-4">
        <details className="rounded border bg-white p-2 text-xs"><summary className="cursor-pointer font-semibold">Estabelecimento</summary><form action={saveEstablishmentAction} className="mt-2 grid gap-1"><input name="name" required placeholder="Nome/razão" className={field} /><input name="document" placeholder="CNPJ/CPF" className={field} /><input name="cnae" placeholder="CNAE" className={field} /><input name="activity" placeholder="Atividade" className={field} /><input name="riskLevel" placeholder="Risco configurado (Baixo/Médio/Alto)" className={field} /><button className="h-8 rounded bg-rose-700 font-semibold text-white">Salvar</button></form></details>
        <details className="rounded border bg-white p-2 text-xs"><summary className="cursor-pointer font-semibold">Denúncia</summary><form action={saveComplaintAction} className="mt-2 grid gap-1"><select name="establishmentId" className={field}><option value="">Estabelecimento</option>{establishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select><input name="place" placeholder="Local (se sem estabelecimento)" className={field} /><textarea name="description" required placeholder="Descrição" className="min-h-12 rounded border p-2" /><label className="flex items-center gap-2"><input type="checkbox" name="isAnonymous" defaultChecked /> Anônima</label><select name="reporterPersonId" className={field}><option value="">Denunciante (se identificada)</option>{patients.map(p => <option key={p.personId} value={p.personId}>{p.person.fullName}</option>)}</select><button className="h-8 rounded bg-rose-700 font-semibold text-white">Registrar</button></form>
          <form action={transitionComplaintAction} className="mt-2 grid gap-1 border-t pt-2"><select name="complaintId" required className={field}><option value="">Denúncia</option>{complaints.map(c => <option key={c.id} value={c.id}>{c.establishment?.name || c.place} · {c.status}</option>)}</select><select name="status" required className={field}><option>Recebida</option><option>Em apuração</option><option>Encerrada</option></select><button className="h-7 rounded border px-2">Atualizar situação</button></form></details>
        <details className="rounded border bg-white p-2 text-xs"><summary className="cursor-pointer font-semibold">Inspeção</summary><form action={saveInspectionAction} className="mt-2 grid gap-1"><select name="establishmentId" required className={field}><option value="">Estabelecimento</option>{establishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select><select name="complaintId" className={field}><option value="">Denúncia vinculada</option>{complaints.map(c => <option key={c.id} value={c.id}>{c.establishment?.name || c.place}</option>)}</select><select name="professionalId" className={field}><option value="">Fiscal/responsável</option>{professionals.map(p => <option key={p.id} value={p.id}>{p.id.slice(0, 8)}</option>)}</select><input name="inspectedAt" type="datetime-local" required className={field} /><input name="reason" placeholder="Motivo" className={field} /><textarea name="items" placeholder="Itens verificados (um por linha)" className="min-h-12 rounded border p-2" /><textarea name="findings" placeholder="Achados da inspeção" className="min-h-12 rounded border p-2" /><button className="h-8 rounded bg-rose-700 font-semibold text-white">Registrar inspeção</button></form>
          <form action={transitionInspectionAction} className="mt-2 grid gap-1 border-t pt-2"><select name="inspectionId" required className={field}><option value="">Inspeção</option>{inspections.map(i => <option key={i.id} value={i.id}>{i.establishment.name} · {i.inspectedAt.toLocaleDateString("pt-BR")}</option>)}</select><select name="status" required className={field}><option>Agendada</option><option>Realizada</option><option>Com pendências</option><option>Encerrada</option></select><button className="h-7 rounded border px-2">Atualizar situação</button></form></details>
        <details className="rounded border bg-white p-2 text-xs"><summary className="cursor-pointer font-semibold">Alvará</summary><form action={issueLicenseAction} className="mt-2 grid gap-1"><select name="establishmentId" required className={field}><option value="">Estabelecimento</option>{establishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select><input name="licenseNumber" required placeholder="Número do alvará" className={field} /><input name="validFrom" type="date" required className={field} /><input name="validUntil" type="date" required className={field} /><button className="h-8 rounded bg-rose-700 font-semibold text-white">Emitir alvará</button></form>
          <form action={transitionLicenseAction} className="mt-2 grid gap-1 border-t pt-2"><select name="licenseId" required className={field}><option value="">Alvará</option>{licenses.map(l => <option key={l.id} value={l.id}>{l.licenseNumber} · {l.status}</option>)}</select><select name="status" required className={field}><option>Válido</option><option>Vencido</option><option>Suspenso</option><option>Cancelado</option></select><button className="h-7 rounded border px-2">Atualizar situação</button></form></details>
      </div>
      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[2fr_1fr]">
        <HealthSimpleListClient rows={establishments.map(e => ({ id: e.id, cells: { name: e.name, document: e.document || "-", cnae: e.cnae || "-", risk: e.riskLevel || "-", license: e.licenses[0] ? `${e.licenses[0].licenseNumber} até ${e.licenses[0].validUntil.toLocaleDateString("pt-BR")}` : "Sem alvará válido", status: e.status } }))} columns={[{ key: "name", label: "Estabelecimento" }, { key: "document", label: "Documento", responsive: "sm", width: "medium" }, { key: "cnae", label: "CNAE", responsive: "md", width: "narrow" }, { key: "risk", label: "Risco", width: "narrow" }, { key: "license", label: "Alvará", responsive: "lg" }, { key: "status", label: "Situação", width: "medium" }]} label="estabelecimentos" searchPlaceholder="Buscar nome, documento ou CNAE" filterKey="status" filterLabel="Todos" serverPagination={{ page, total, pathname: "/app-domain/saude/vigilancia", search: q, filter, filterOptions: ["Ativo", "Inativo", "Interditado"] }} />
        <div className="min-h-0 overflow-y-auto rounded border bg-white p-2"><h2 className="sticky top-0 bg-white pb-2 text-xs font-bold uppercase text-slate-500">Denúncias e inspeções</h2>{complaints.slice(0, 30).map(c => <article key={c.id} className="mb-1 rounded border p-2 text-xs"><strong>Denúncia · {c.establishment?.name || c.place}</strong><p className="text-slate-500">{c.isAnonymous ? "Anônima" : "Identificada"} · {c.status}</p></article>)}{inspections.slice(0, 30).map(i => <article key={i.id} className="mb-1 rounded border p-2 text-xs"><strong>Inspeção · {i.establishment.name}</strong><p className="text-slate-500">{i.inspectedAt.toLocaleDateString("pt-BR")} · {i.status} · {i.items.filter(it => it.result === "Não conforme").length} não conformidades</p></article>)}</div>
      </div>
    </PageFrame>
  );
}
