import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import OperacoesTributariasClient from "./OperacoesTributariasClient";
import { PageFrame } from "@/components/app-ui/PageFrame";

export const dynamic = "force-dynamic";

export default async function OperacoesTributariasPage() {
  const { prisma } = await getTenantContextForModule("TRIBUTACAO");
  const [taxes, taxpayers, processes, documents, activities, assessments, parameters, requests, evaluations] = await Promise.all([
    prisma.tax.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.taxpayer.findMany({ where: { status: "Ativo" }, include: { person: true, company: true }, orderBy: { createdAt: "desc" } }),
    prisma.process.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, protocolNumber: true, status: true } }),
    prisma.document.findMany({ where: { status: "Válido" }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, title: true } }),
    prisma.taxServiceActivity.findMany({ where: { isActive: true }, include: { tax: true }, orderBy: { code: "asc" } }),
    prisma.taxAssessment.findMany({ where: { status: { in: ["Lançado", "Emitido", "Parcial"] } }, include: { tax: true, taxpayer: { include: { person: true, company: true } } }, take: 30, orderBy: { createdAt: "desc" } }),
    prisma.taxParameter.findMany({ include: { tax: true }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.taxServiceRequest.findMany({ include: { taxpayer: { include: { person: true, company: true } }, process: true }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.taxCertificateEvaluation.findMany({ include: { taxpayer: { include: { person: true, company: true } } }, orderBy: { evaluatedAt: "desc" }, take: 10 }),
  ]);
  const name = (taxpayer: typeof taxpayers[number]) => taxpayer.company?.corporateName ?? taxpayer.person?.fullName ?? "Contribuinte sem nome";
  return <PageFrame className="space-y-3"><OperacoesTributariasClient taxes={taxes.map((tax) => ({ id: tax.id, name: tax.name }))} taxpayers={taxpayers.map((taxpayer) => ({ id: taxpayer.id, name: name(taxpayer) }))} processes={processes} documents={documents} activities={activities.map((activity) => ({ id: activity.id, name: `${activity.code} - ${activity.name} (${activity.tax.name})`, rate: activity.issRate?.toString() ?? "-" }))} assessments={assessments.map((assessment) => ({ id: assessment.id, label: `${assessment.assessmentNumber ?? assessment.id} - ${assessment.tax.name} - ${name(assessment.taxpayer)}` }))} parameters={parameters.map((parameter) => ({ id: parameter.id, label: `${parameter.tax.name}: ${parameter.code} (${parameter.calculationType})` }))} requests={requests.map((request) => ({ id: request.id, serviceType: request.serviceType, status: request.status, taxpayer: name(request.taxpayer), process: request.process?.protocolNumber ?? "Sem processo" }))} evaluations={evaluations.map((evaluation) => ({ id: evaluation.id, result: evaluation.result, pendingCount: evaluation.pendingCount, taxpayer: name(evaluation.taxpayer), date: evaluation.evaluatedAt.toISOString() }))} /></PageFrame>;
}
