import { FileCheck2 } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { EducationListClient } from "../EducationListClient";
import { EducacensoClient } from "./EducacensoClient";

export const dynamic = "force-dynamic";
export default async function EducacensoPage() {
  const { prisma } = await getTenantContextForModule("EDUCACAO");
  const operations = await prisma.educacensoOperation.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return <PageFrame className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden"><PageHeader title="Educacenso" icon={<FileCheck2 className="size-4 text-emerald-600" />} /><EducacensoClient /><div className="min-h-0 flex-1"><EducationListClient rows={operations.map((item) => ({ id: item.id, cells: { date: item.createdAt.toLocaleString("pt-BR"), type: item.operationType, competence: item.competence, file: item.fileName, summary: `${item.recordsRead} lidos · ${item.updatedRecords} atualizados · ${item.inconsistentRecords} críticas`, status: item.status }, detail: { Operação: item.operationType, Competência: item.competence, Leiaute: item.layoutVersion, Arquivo: item.fileName, Resumo: `${item.recordsRead} lidos; ${item.validRecords} válidos; ${item.updatedRecords} atualizados; ${item.inconsistentRecords} com críticas; ${item.ignoredRecords} ignorados`, Situação: item.status, Críticas: JSON.stringify(item.issues || [], null, 2) } }))} columns={[{ key: "date", label: "Data", width: "medium" }, { key: "type", label: "Operação" }, { key: "competence", label: "Competência", width: "medium" }, { key: "file", label: "Arquivo" }, { key: "summary", label: "Resumo", responsive: "lg" }, { key: "status", label: "Situação", width: "medium" }]} searchPlaceholder="Buscar operação, competência ou arquivo..." label="operações" filterKey="status" statusKey="status" detailTitleKey="file" actions={false} /></div></PageFrame>;
}
