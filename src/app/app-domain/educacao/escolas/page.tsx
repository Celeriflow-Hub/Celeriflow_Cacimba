import Link from "next/link";
import { Plus, School } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { EducationListClient } from "../EducationListClient";

export const dynamic = "force-dynamic";

export default async function EscolasPage() {
  const { prisma } = await getTenantContextForModule("EDUCACAO");
  const schools = await prisma.school.findMany({ include: { director: { include: { person: true } }, _count: { select: { classes: true, enrollments: true } } }, orderBy: { name: "asc" } });
  const rows = schools.map((school) => ({ id: school.id, cells: { school: school.name, inep: school.inepCode || "Não informado", director: school.director?.person?.fullName || "Não designado", capacity: String(school.capacity), classes: String(school._count.classes), students: String(school._count.enrollments), status: school.isActive ? "Ativa" : "Inativa" }, detail: { Escola: school.name, INEP: school.inepCode || "Não informado", Direção: school.director?.person?.fullName || "Não designado", Capacidade: `${school.capacity} vagas`, Turmas: String(school._count.classes), Matrículas: String(school._count.enrollments), Situação: school.isActive ? "Ativa" : "Inativa" } }));
  return <PageFrame className="flex h-full min-h-0 flex-1 flex-col gap-1 overflow-hidden"><PageHeader title="Escolas" icon={<School className="size-4 text-indigo-600" />} action={<Link href="/educacao/escolas/novo" className="inline-flex h-8 items-center gap-1.5 rounded bg-blue-600 px-3 text-xs font-semibold text-white"><Plus className="size-3.5" />Nova escola</Link>} /><EducationListClient rows={rows} columns={[{ key: "school", label: "Escola" }, { key: "inep", label: "INEP", width: "medium" }, { key: "director", label: "Direção", responsive: "md" }, { key: "capacity", label: "Vagas", width: "narrow", align: "right" }, { key: "classes", label: "Turmas", width: "narrow", align: "right", responsive: "lg" }, { key: "students", label: "Alunos", width: "narrow", align: "right" }, { key: "status", label: "Situação", width: "medium" }]} searchPlaceholder="Buscar escola, INEP ou direção..." label="escolas" filterKey="status" filterLabel="Todas as situações" statusKey="status" detailTitleKey="school" /></PageFrame>;
}
