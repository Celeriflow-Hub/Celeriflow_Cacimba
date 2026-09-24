import Link from "next/link";
import { AlertTriangle, Truck } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import type { FleetPageIssue } from "@/lib/frotas/page-errors";

export function FleetUnavailable({ issue }: { issue: FleetPageIssue }) {
  return (
    <PageFrame className="space-y-3">
      <PageHeader title="Frotas" icon={<Truck className="size-4 text-teal-700" />} />
      <div role="alert" className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-slate-800">
        <h2 className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4 shrink-0 text-amber-700" />{issue.title}</h2>
        <p>{issue.message}</p>
        <div className="flex flex-wrap gap-2">
          <a href={issue.kind === "session" ? "/login" : "/frotas"} className="inline-flex min-h-11 items-center justify-center rounded bg-teal-700 px-4 font-medium text-white">{issue.kind === "session" ? "Entrar novamente" : "Verificar novamente"}</a>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded border border-slate-300 bg-white px-4 font-medium text-slate-700">Voltar aos módulos</Link>
        </div>
      </div>
    </PageFrame>
  );
}
