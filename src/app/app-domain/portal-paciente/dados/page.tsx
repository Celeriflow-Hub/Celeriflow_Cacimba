import { redirect } from "next/navigation";
import Link from "next/link";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { getPatientPortalAccess } from "@/lib/portal-paciente/access";
import { updateContactAction } from "../actions";

const field = "h-8 min-w-0 rounded border border-slate-200 bg-white px-2 text-xs";

export default async function PortalDadosPage() {
  const access = await getPatientPortalAccess();
  if (access.status !== "AVAILABLE") redirect("/app-domain/login");
  const person = await access.context.prisma.person.findUnique({ where: { id: access.patient.personId }, select: { fullName: true, cpf: true, phonePrimary: true, phoneSecondary: true, whatsapp: true, email: true } });
  return (
    <PageFrame className="flex h-[calc(100dvh-7.5rem)] min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title="Meus dados" />
      <div className="grid min-h-0 flex-1 gap-2 overflow-y-auto md:grid-cols-2">
        <div className="h-fit rounded border bg-white p-3 text-xs"><h2 className="font-bold uppercase text-slate-500">Identificação</h2><p className="mt-1"><strong>{person?.fullName}</strong></p><p className="text-slate-500">CPF {person?.cpf || "-"}</p><p className="mt-2 text-slate-500">Alterações de identidade e documentos clínicos devem ser solicitadas na unidade de saúde.</p></div>
        <form action={updateContactAction} className="grid h-fit gap-1 rounded border bg-white p-3 text-xs"><h2 className="font-bold uppercase text-slate-500">Contatos (editável)</h2><input name="phonePrimary" defaultValue={person?.phonePrimary || ""} placeholder="Telefone principal" className={field} /><input name="phoneSecondary" defaultValue={person?.phoneSecondary || ""} placeholder="Telefone secundário" className={field} /><input name="whatsapp" defaultValue={person?.whatsapp || ""} placeholder="WhatsApp" className={field} /><input name="email" defaultValue={person?.email || ""} placeholder="E-mail" className={field} /><button className="h-8 rounded bg-emerald-700 px-2 font-semibold text-white">Salvar contatos</button></form>
        <div className="h-fit rounded border bg-white p-3 text-xs md:col-span-2"><Link href="/app-domain/login" className="text-sky-700 underline">Recuperar acesso / trocar conta</Link></div>
      </div>
    </PageFrame>
  );
}
