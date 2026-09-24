import { BookOpen, Plus } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { EducationListClient } from "../EducationListClient";

export const dynamic = "force-dynamic";

export default async function ProfessoresPage() {
  const { prisma } = await getTenantContextForModule("EDUCACAO");
  const teachers = await prisma.teacher.findMany({ include: { employee: true, taughtClasses: { include: { school: true } } }, orderBy: { employee: { name: "asc" } } });
  const rows = teachers.map((teacher) => { const schools = Array.from(new Set(teacher.taughtClasses.map((item) => item.school.name))).join(", ") || "Nenhuma escola"; return { id: teacher.id, cells: { teacher: teacher.employee.name, registration: teacher.employee.registration || "-", schools, classes: String(teacher.taughtClasses.length), status: teacher.employee.isActive ? "Ativo" : "Inativo" }, detail: { Professor: teacher.employee.name, Matrícula: teacher.employee.registration || "Não informada", Escolas: schools, Turmas: String(teacher.taughtClasses.length), Situação: teacher.employee.isActive ? "Ativo" : "Inativo" } }; });
  return <PageFrame className="flex h-full min-h-0 flex-1 flex-col gap-1 overflow-hidden"><PageHeader title="Professores" icon={<BookOpen className="size-4 text-emerald-600" />} action={<button type="button" className="inline-flex h-8 items-center gap-1.5 rounded bg-emerald-600 px-3 text-xs font-semibold text-white"><Plus className="size-3.5" />Novo professor</button>} /><EducationListClient rows={rows} columns={[{ key: "teacher", label: "Professor" }, { key: "registration", label: "Matrícula", width: "medium" }, { key: "schools", label: "Escolas", responsive: "md" }, { key: "classes", label: "Turmas", width: "narrow", align: "right" }, { key: "status", label: "Situação", width: "medium" }]} searchPlaceholder="Buscar professor, matrícula ou escola..." label="professores" filterKey="status" filterLabel="Todas as situações" statusKey="status" detailTitleKey="teacher" /></PageFrame>;
}
