import Link from "next/link";
import { getOmbudsmanContextForProtocols } from "@/lib/attendance/access";
import { createOmbudsman } from "../../../atendimento/actions";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function NovaManifestacaoProtocolosPage() {
  const context = await getOmbudsmanContextForProtocols();
  if (!context.attendanceAccess.isOmbudsman || !context.attendanceAccess.canCreate) {
    throw new Error("Abertura de manifestações restrita à Ouvidoria com permissão de edição em Processos.");
  }
  const [channels, departments] = await Promise.all([
    context.prisma.supportChannel.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    context.prisma.department.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <PageFrame className="max-w-3xl space-y-3">
      <PageHeader title="Nova manifestação" action={<Link href="/protocolos/ouvidoria" className="text-xs font-semibold text-amber-800 hover:text-amber-950">Voltar para Ouvidoria</Link>} />
      <p className="text-xs text-slate-500">Registro interno. A identidade é separada da manifestação e não é copiada automaticamente para um processo formal.</p>
      <form action={createOmbudsman} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <input type="hidden" name="originModule" value="PROCESSOS" />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="field">Tipo *<select name="type" required className="input"><option>Denúncia</option><option>Reclamação</option><option>Sugestão</option><option>Elogio</option></select></label>
          <label className="field">Canal *<select name="channelId" required className="input">{channels.map((channel) => <option key={channel.id} value={channel.id}>{channel.name}</option>)}</select></label>
          <label className="field">Setor inicial<select name="departmentId" className="input"><option value="">Manter em triagem da Ouvidoria</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
          <label className="field">Assunto *<input name="subject" required className="input" /></label>
        </div>
        <label className="field">Descrição *<textarea name="description" required rows={6} className="input resize-none" /></label>
        <div className="flex flex-wrap gap-5"><label className="flex gap-2 text-sm"><input type="checkbox" name="isAnonymous" /> Manifestação anônima</label><label className="flex gap-2 text-sm"><input type="checkbox" name="isConfidential" /> Manifestação confidencial</label></div>
        <div className="grid gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 md:grid-cols-2"><label className="field">Nome do manifestante<input name="fullName" className="input" /></label><label className="field">CPF do manifestante<input name="cpf" className="input" /></label></div>
        <div className="flex justify-end"><button className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800">Registrar manifestação</button></div>
      </form>
    </PageFrame>
  );
}
