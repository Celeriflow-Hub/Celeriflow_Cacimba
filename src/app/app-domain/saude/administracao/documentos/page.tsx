import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { Files } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { canPerformModuleOperation, getTenantContextForModule } from "@/lib/platform/tenant-context";
import { DocumentsClient, type HealthDocumentRow } from "./DocumentsClient";

const PAGE_SIZE = 20;
type Params = { q?: string | string[]; page?: string | string[]; module?: string | string[]; category?: string | string[]; status?: string | string[] };
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const number = (value: string | undefined) => value && /^\d+$/.test(value) && Number(value) > 0 ? Number(value) : 1;
function pageHref(page: number, values: Record<string, string>) { const query = new URLSearchParams(Object.entries({ ...values, page: String(page) }).filter(([, value]) => value)); return `/app-domain/saude/administracao/documentos?${query}`; }

export default async function HealthDocumentsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const context = await getTenantContextForModule("SAUDE");
  const params = await searchParams;
  const q = (first(params.q) || "").trim().slice(0, 120);
  const moduleCode = (first(params.module) || "").trim().slice(0, 50);
  const category = (first(params.category) || "").trim().slice(0, 50);
  const status = (first(params.status) || "").trim().slice(0, 50);
  const where: Prisma.HealthStandardDocumentWhereInput = { isActive: true, ...(moduleCode ? { moduleCode } : {}), ...(category ? { category } : {}), ...(status ? { document: { status } } : {}), ...(q ? { document: { title: { contains: q, mode: "insensitive" }, ...(status ? { status } : {}) } } : {}) };
  const total = await context.prisma.healthStandardDocument.count({ where });
  const requestedPage = number(first(params.page));
  const page = Math.min(requestedPage, Math.max(1, Math.ceil(total / PAGE_SIZE)));
  const [documents, modules] = await Promise.all([
    context.prisma.healthStandardDocument.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true, documentId: true, category: true, moduleCode: true, createdAt: true,
        addedByUsuario: { select: { nome: true } },
        document: { select: {
          title: true, fileUrl: true, status: true,
          versions: { orderBy: { versionNumber: "desc" }, select: { id: true, versionNumber: true, fileUrl: true, status: true, finalizedAt: true, publicValidationCode: true } },
          signatures: { orderBy: { requestedAt: "desc" }, select: { id: true, signerName: true, status: true, signedAt: true, provider: true, verificationCode: true, metadata: true } },
        } },
      },
    }),
    context.prisma.configuracaoModulo.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { codigo: true, nome: true } }),
  ]);
  const rows: HealthDocumentRow[] = documents.map(item => ({ id: item.id, documentId: item.documentId, title: item.document.title, category: item.category, moduleCode: item.moduleCode, fileUrl: item.document.fileUrl, status: item.document.status, createdAt: item.createdAt.toISOString(), addedBy: item.addedByUsuario.nome, versions: item.document.versions.map(version => ({ ...version, finalizedAt: version.finalizedAt.toISOString() })), signatures: item.document.signatures.map(signature => ({ ...signature, signedAt: signature.signedAt?.toISOString() || null })) }));
  const values = { q, module: moduleCode, category, status };
  return <PageFrame className="flex h-full min-h-0 max-w-none flex-1 flex-col gap-2 overflow-hidden"><PageHeader title="Documentos da Saúde" icon={<Files className="size-4 text-emerald-700" />} className="mb-0 shrink-0" action={<Link href="/app-domain/saude/administracao" className="inline-flex h-7 items-center rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700">Administração</Link>} /><form method="get" className="grid shrink-0 gap-2 rounded-md border bg-white p-2 sm:grid-cols-2 lg:grid-cols-[1fr_160px_150px_150px_auto]"><input name="q" defaultValue={q} placeholder="Buscar documento" className="h-8 rounded border px-2.5 text-xs" /><select name="module" defaultValue={moduleCode} className="h-8 rounded border bg-white px-2 text-xs"><option value="">Todos os módulos</option>{modules.map(module => <option key={module.codigo} value={module.codigo}>{module.nome}</option>)}</select><select name="category" defaultValue={category} className="h-8 rounded border bg-white px-2 text-xs"><option value="">Todas as categorias</option>{["Procedimento", "Orientação", "Formulário", "Protocolo", "Outro"].map(value => <option key={value}>{value}</option>)}</select><select name="status" defaultValue={status} className="h-8 rounded border bg-white px-2 text-xs"><option value="">Todas as situações</option><option>Válido</option><option>Pendente Assinatura</option><option>Assinado</option></select><button className="h-8 rounded bg-slate-800 px-4 text-xs font-bold text-white">Buscar</button></form><DocumentsClient rows={rows} modules={modules.map(module => ({ code: module.codigo, name: module.nome }))} canCreate={canPerformModuleOperation(context.user, "SAUDE", "create")} canUpdate={canPerformModuleOperation(context.user, "SAUDE", "update")} /><div className="shrink-0 px-1"><ErpPagination page={page} total={total} previousHref={pageHref(Math.max(1, page - 1), values)} nextHref={pageHref(page + 1, values)} label="documentos" jumpTo={{ pathname: "/app-domain/saude/administracao/documentos", values }} /></div></PageFrame>;
}
