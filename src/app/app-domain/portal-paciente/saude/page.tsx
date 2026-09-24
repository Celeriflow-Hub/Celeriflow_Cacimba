import { redirect } from "next/navigation";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { getPatientPortalAccess } from "@/lib/portal-paciente/access";
import { portalDispensations, portalDocuments, portalLabReports, portalReferralsRegulation, portalVaccinations } from "@/lib/saude/patient-portal-service";

const box = "rounded border bg-white p-2";

export default async function PortalSaudePage() {
  const access = await getPatientPortalAccess();
  if (access.status !== "AVAILABLE") redirect("/app-domain/login");
  const [vaccinations, reports, dispensations, refreg, documents] = await Promise.all([
    portalVaccinations(access.context, access.patient.id),
    portalLabReports(access.context, access.patient.id),
    portalDispensations(access.context, access.patient.id),
    portalReferralsRegulation(access.context, access.patient.id),
    portalDocuments(access.context, access.patient.id),
  ]);
  return (
    <PageFrame className="flex h-[calc(100dvh-7.5rem)] min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title="Minha saúde" />
      <div className="grid min-h-0 flex-1 gap-2 overflow-y-auto md:grid-cols-2">
        <div className={box}><h2 className="text-xs font-bold uppercase text-slate-500">Caderneta de vacinação</h2>{vaccinations.map(v => <p key={v.id} className="border-b py-1 text-xs"><strong>{v.vaccine.name}</strong> · dose {v.doseNumber} · {v.date.toLocaleDateString("pt-BR")} · {v.unit?.name}</p>)}{vaccinations.length === 0 && <p className="text-xs text-slate-400">Sem registros.</p>}</div>
        <div className={box}><h2 className="text-xs font-bold uppercase text-slate-500">Laudos liberados</h2>{reports.map(r => <p key={r.id} className="border-b py-1 text-xs"><strong>{r.document.title}</strong> · {r.releasedAt?.toLocaleDateString("pt-BR")} · <a href={r.document.fileUrl} className="text-sky-700 underline">Abrir</a></p>)}{reports.length === 0 && <p className="text-xs text-slate-400">Nenhum laudo liberado para você.</p>}</div>
        <div className={box}><h2 className="text-xs font-bold uppercase text-slate-500">Medicamentos dispensados</h2>{dispensations.map(d => <p key={d.id} className="border-b py-1 text-xs"><strong>{d.medicine.name}</strong> · {d.quantity} · {d.date.toLocaleDateString("pt-BR")} · {d.unit?.name}{d.nextWithdrawalAt ? ` · retorno ${d.nextWithdrawalAt.toLocaleDateString("pt-BR")}` : ""}</p>)}{dispensations.length === 0 && <p className="text-xs text-slate-400">Sem dispensações.</p>}</div>
        <div className={box}><h2 className="text-xs font-bold uppercase text-slate-500">Encaminhamentos e regulação</h2>{refreg.referrals.map(r => <p key={r.id} className="border-b py-1 text-xs"><strong>{r.specialty}</strong> · {r.status} · {r.date.toLocaleDateString("pt-BR")}</p>)}{refreg.regulations.map(r => <p key={r.id} className="border-b py-1 text-xs"><strong>{r.specialty?.name || r.service?.name}</strong> · {r.status}{r.guideNumber ? ` · guia ${r.guideNumber}` : ""}</p>)}{(refreg.referrals.length + refreg.regulations.length) === 0 && <p className="text-xs text-slate-400">Sem registros.</p>}</div>
        <div className={`${box} md:col-span-2`}><h2 className="text-xs font-bold uppercase text-slate-500">Documentos clínicos</h2>{documents.map(d => <p key={d.id} className="border-b py-1 text-xs"><strong>{d.document.title}</strong> · {d.kind} · <a href={d.document.fileUrl} className="text-sky-700 underline">Abrir</a></p>)}{documents.length === 0 && <p className="text-xs text-slate-400">Sem documentos.</p>}</div>
      </div>
    </PageFrame>
  );
}
