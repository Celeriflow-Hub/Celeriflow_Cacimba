import { redirect } from "next/navigation";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { getPatientPortalAccess } from "@/lib/portal-paciente/access";
import { portalManifestations } from "@/lib/saude/patient-portal-service";
import { createManifestationAction } from "../actions";

const field = "h-8 min-w-0 rounded border border-slate-200 bg-white px-2 text-xs";

export default async function PortalOuvidoriaPage() {
  const access = await getPatientPortalAccess();
  if (access.status !== "AVAILABLE") redirect("/app-domain/login");
  const items = await portalManifestations(access.context, access.patient.personId);
  return (
    <PageFrame className="flex h-[calc(100dvh-7.5rem)] min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title="Ouvidoria" />
      <details className="shrink-0 rounded border bg-white p-2 text-xs"><summary className="cursor-pointer font-semibold">Nova manifestação</summary><form action={createManifestationAction} className="mt-2 grid gap-1"><select name="type" required className={field}><option value="Reclamação">Reclamação</option><option value="Denúncia">Denúncia</option><option value="Sugestão">Sugestão</option><option value="Elogio">Elogio</option></select><input name="subject" required placeholder="Assunto" className={field} /><textarea name="description" required placeholder="Descreva com detalhes" className="min-h-20 rounded border p-2" /><label className="flex items-center gap-2"><input type="checkbox" name="isAnonymous" /> Manifestação anônima</label><button className="h-8 rounded bg-emerald-700 px-2 font-semibold text-white">Enviar</button></form></details>
      <div className="grid min-h-0 flex-1 gap-2 overflow-y-auto">
        {items.map(m => (
          <article key={m.id} className="rounded border bg-white p-2 text-xs">
            <strong>{m.protocolNumber} · {m.type} · {m.status}</strong>
            <p className="text-slate-500">{m.subject} · {m.createdAt.toLocaleDateString("pt-BR")}</p>
            {m.response && <p className="mt-1"><strong>Resposta:</strong> {m.response}</p>}
            {m.interactions.map(i => <p key={`${i.type}-${i.createdAt.toISOString()}`} className="mt-1 text-slate-600">{i.type}: {i.message}</p>)}
            {m.movements.map((mv, idx) => <p key={idx} className="text-slate-400">Tramitação: {mv.reason || "movimentado"} · {mv.createdAt.toLocaleDateString("pt-BR")}</p>)}
          </article>
        ))}
        {items.length === 0 && <p className="text-xs text-slate-400">Nenhuma manifestação identificada. Manifestações anônimas não aparecem aqui.</p>}
      </div>
    </PageFrame>
  );
}
