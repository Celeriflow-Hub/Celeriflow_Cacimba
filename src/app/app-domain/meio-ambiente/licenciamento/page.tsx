import React from "react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { ShieldCheck, Search } from "lucide-react";
import { NewLicenseSheet } from "../components/NewLicenseSheet";
import { QuickFilters } from "../components/QuickFilters";
import { LicenseRowActions } from "../components/LicenseRowActions";
import { LicenciamentoInteractiveClient } from "./LicenciamentoInteractiveClient";
import type { Prisma } from "@prisma/client";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { environmentPageHref, filterAndPaginate } from "../list-utils";

export const dynamic = "force-dynamic";

export default async function LicenciamentoPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> | { [key: string]: string | undefined } }) {
  const { prisma } = await getTenantContextForModule("MEIO_AMBIENTE");
  const searchParams = await Promise.resolve(props.searchParams || {});
  const where: Prisma.EnvLicenseWhereInput = {};
  if (searchParams.status) where.status = searchParams.status;

  const licenses = await prisma.envLicense.findMany({ where, include: { enterprise: true }, orderBy: { createdAt: "desc" } });
  const enterprises = await prisma.envEnterprise.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });

  const list = filterAndPaginate(licenses, searchParams);

  return (
    <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title="Licenciamento Ambiental" icon={<ShieldCheck className="size-4 shrink-0 text-blue-600" />} action={<NewLicenseSheet enterprises={enterprises} />} className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white" />

      <details className="shrink-0 rounded-md border border-blue-200 bg-white px-3 py-2">
        <summary className="cursor-pointer text-xs font-semibold text-blue-700">Motor de licenciamento ambiental</summary>
        <div className="mt-2 max-h-[55vh] overflow-y-auto"><LicenciamentoInteractiveClient /></div>
      </details>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800" aria-label="Lista de licenças ambientais">
        <div className="flex flex-col gap-2 border-b border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50 sm:flex-row sm:items-center sm:justify-between">
          <form method="get" action="/meio-ambiente/licenciamento" className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="search" name="q" defaultValue={list.query} aria-label="Buscar licença" placeholder="Buscar licença..." className="h-9 w-full rounded-md border bg-white pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white" />
          </form>
          <QuickFilters filters={[
            { name: "status", label: "Status", options: [{ value: "Emitida", label: "Emitida" }, { value: "Em Analise", label: "Em Analise" }, { value: "Vencida", label: "Vencida" }, { value: "Suspensa", label: "Suspensa" }, { value: "Cassada", label: "Cassada" }] }
          ]} />
        </div>
        {list.filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma licenca emitida.</p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="sticky top-0 z-10 text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2">No Licenca</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Empreendimento</th>
                  <th className="px-3 py-2">Validade</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((lic) => (
                  <tr key={lic.id} className="h-[38px] border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-1.5 font-medium text-gray-900 dark:text-white">{lic.licenseNumber}</td>
                    <td className="px-3 py-1.5 text-gray-500">{lic.licenseType}</td>
                    <td className="px-3 py-1.5 font-medium text-gray-900">{lic.enterprise.name}</td>
                    <td className="px-3 py-1.5 text-gray-500">{lic.validUntil ? new Date(lic.validUntil).toLocaleDateString("pt-BR") : "Indeterminado"}</td>
                    <td className="px-3 py-1.5">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${lic.status === "Emitida" ? "bg-green-100 text-green-700" : lic.status === "Vencida" ? "bg-red-100 text-red-700" : lic.status === "Suspensa" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}`}>
                        {lic.status}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <LicenseRowActions license={lic} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ErpPagination page={list.currentPage} total={list.filtered.length} pageSize={list.pageSize} previousHref={environmentPageHref('/meio-ambiente/licenciamento', searchParams, Math.max(1, list.currentPage - 1))} nextHref={environmentPageHref('/meio-ambiente/licenciamento', searchParams, Math.min(list.totalPages, list.currentPage + 1))} />
</section>
    </PageFrame>
  );
}
