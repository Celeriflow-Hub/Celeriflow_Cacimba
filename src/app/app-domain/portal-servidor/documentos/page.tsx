import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { buttonVariants } from "@/components/ui/button";
import { getEmployeePortalAccess } from "@/lib/portal-servidor/access";
import type { Prisma } from "@prisma/client";
import { FileSignature, FileText, Search } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const signatureStatuses = ["PENDING", "SIGNED", "REJECTED", "CANCELLED"] as const;

type SearchParams = {
  q?: string | string[];
  status?: string | string[];
  page?: string | string[];
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function parseStatus(value: string | string[] | undefined) {
  const status = firstValue(value).toUpperCase();
  return signatureStatuses.includes(status as (typeof signatureStatuses)[number]) ? status : "";
}

function resolvePage(value: string | string[] | undefined, total: number) {
  const requested = Number.parseInt(firstValue(value), 10);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, totalPages) : 1;
}

function hrefFor(page: number, values: { q: string; status: string }) {
  const params = new URLSearchParams();
  if (values.q) params.set("q", values.q);
  if (values.status) params.set("status", values.status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return "/portal-servidor/documentos" + (query ? "?" + query : "");
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(value);
}

function signatureStatusLabel(status: string) {
  if (status === "PENDING") return "Pendente";
  if (status === "SIGNED") return "Assinado";
  if (status === "REJECTED") return "Recusado";
  if (status === "CANCELLED") return "Cancelado";
  return status;
}

function signatureStatusClass(status: string) {
  if (status === "SIGNED") return "bg-emerald-100 text-emerald-800";
  if (status === "REJECTED") return "bg-red-100 text-red-800";
  if (status === "CANCELLED") return "bg-slate-100 text-slate-700";
  return "bg-amber-100 text-amber-800";
}

function PortalUnavailable() {
  return (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center p-3">
      <section className="max-w-md border border-slate-300 bg-white p-5 text-center shadow-sm">
        <FileText className="mx-auto size-6 text-slate-400" />
        <h1 className="mt-2 text-sm font-semibold text-slate-900">Documentos indisponíveis</h1>
        <p className="mt-1 text-xs leading-5 text-slate-600">Seu acesso ainda não está vinculado a um cadastro funcional ativo.</p>
      </section>
    </div>
  );
}

export default async function DocumentosPortalPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const access = await getEmployeePortalAccess();
  if (access.status !== "AVAILABLE") return <PortalUnavailable />;

  const params = await searchParams;
  const q = firstValue(params.q).trim().slice(0, 120);
  const status = parseStatus(params.status);
  const { context, employee } = access;
  const conditions: Prisma.DocumentSignatureWhereInput[] = [{ signerEmployeeId: employee.id }];

  if (status) conditions.push({ status });
  if (q) {
    conditions.push({
      document: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { documentType: { contains: q, mode: "insensitive" } },
        ],
      },
    });
  }

  const where: Prisma.DocumentSignatureWhereInput = { AND: conditions };
  const total = await context.prisma.documentSignature.count({ where });
  const page = resolvePage(params.page, total);
  const signatures = await context.prisma.documentSignature.findMany({
    where,
    select: {
      id: true,
      status: true,
      requestedAt: true,
      signedAt: true,
      rejectedAt: true,
      document: { select: { title: true, documentType: true, status: true } },
    },
    orderBy: [{ requestedAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 p-2 sm:p-3">
      <ErpPageTitle
        title="Documentos e assinaturas"
        description="Consulta das solicitações de assinatura vinculadas ao seu cadastro funcional."
        icon={<FileSignature className="size-5 shrink-0 text-emerald-700" />}
        action={<Link href="/portal-servidor/ficha-funcional" className="inline-flex h-8 items-center gap-1.5 rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">Minha ficha</Link>}
      />

      <ErpListFrame
        toolbar={
          <form className="grid items-center gap-2 md:grid-cols-[minmax(0,1fr)_150px_auto_auto]" role="search">
            <label className="relative block"><span className="sr-only">Buscar documento</span><Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input name="q" defaultValue={q} placeholder="Documento ou tipo" className="h-7 w-full rounded border border-slate-300 bg-white py-1 pl-8 pr-2 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15" /></label>
            <select name="status" defaultValue={status} aria-label="Filtrar por situação" className="h-7 rounded border border-slate-300 bg-white px-2 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"><option value="">Todas as situações</option><option value="PENDING">Pendentes</option><option value="SIGNED">Assinados</option><option value="REJECTED">Recusados</option><option value="CANCELLED">Cancelados</option></select>
            <button type="submit" className={buttonVariants({ size: "sm", className: "h-7 px-3 text-xs" })}>Aplicar</button>
            <Link href="/portal-servidor/documentos" className="inline-flex h-7 items-center justify-center rounded border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">Limpar</Link>
          </form>
        }
        summary={<p className="text-[11px] text-slate-600"><strong className="text-slate-900">{total}</strong> documento(s) ou assinatura(s) no seu histórico</p>}
        pagination={<ErpPagination page={page} total={total} pageSize={PAGE_SIZE} label="documentos" previousHref={hrefFor(Math.max(1, page - 1), { q, status })} nextHref={hrefFor(page + 1, { q, status })} />}
      >
        {signatures.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center p-6 text-center"><FileText className="size-5 text-slate-400" /><h2 className="mt-2 text-sm font-semibold text-slate-700">Nenhum documento encontrado</h2><p className="mt-1 max-w-md text-xs text-slate-500">As solicitações de assinatura vinculadas ao seu cadastro aparecerão nesta área.</p></div>
        ) : (
          <>
            <div className="hidden h-full md:block">
              <table className="w-full table-fixed text-left text-[11px] leading-4 text-slate-700">
                <thead className="h-7 border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500"><tr><th className="w-[46%] px-3">Documento</th><th className="w-[22%] px-3">Tipo</th><th className="w-[16%] px-3">Situação</th><th className="w-[16%] px-3 text-right">Solicitado em</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {signatures.map((signature) => <tr key={signature.id} className="h-[clamp(18px,2.65vh,28px)] hover:bg-slate-50"><td className="px-3 py-0 font-semibold text-slate-800"><span className="block truncate" title={signature.document.title}>{signature.document.title}</span></td><td className="px-3 py-0"><span className="block truncate">{signature.document.documentType || "Documento"}</span></td><td className="px-3 py-0"><span className={["inline-flex max-w-full truncate rounded px-1.5 py-0 text-[10px] font-semibold leading-4", signatureStatusClass(signature.status)].join(" ")}>{signatureStatusLabel(signature.status)}</span></td><td className="px-3 py-0 text-right text-[10px] text-slate-600">{formatDate(signature.requestedAt)}</td></tr>)}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 overflow-y-auto md:hidden">
              {signatures.map((signature) => <article key={signature.id} className="space-y-1.5 p-3"><div className="flex items-start justify-between gap-2"><p className="min-w-0 truncate text-xs font-semibold text-slate-900">{signature.document.title}</p><span className={["shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold", signatureStatusClass(signature.status)].join(" ")}>{signatureStatusLabel(signature.status)}</span></div><p className="truncate text-[11px] text-slate-600">{signature.document.documentType || "Documento"}</p><p className="text-[11px] text-slate-500">Solicitado em {formatDate(signature.requestedAt)}</p></article>)}
            </div>
          </>
        )}
      </ErpListFrame>
    </div>
  );
}
