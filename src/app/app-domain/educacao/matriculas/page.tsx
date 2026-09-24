import { Users } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { EducationListClient } from "../EducationListClient";
import { S1ActionForm } from "../S1ActionForm";
import { createEnrollmentAction, moveEnrollmentAction } from "../s1-actions";

export const dynamic = "force-dynamic";
export default async function MatriculasPage() {
  const { prisma } = await getTenantContextForModule("EDUCACAO");
  const [students, classes, enrollments] = await Promise.all([
    prisma.student.findMany({ where: { status: "Ativo" }, include: { person: true }, orderBy: { person: { fullName: "asc" } } }),
    prisma.schoolClass.findMany({ where: { status: "Aberta" }, include: { school: true, _count: { select: { enrollments: { where: { status: "Matriculado" } } } } }, orderBy: [{ school: { name: "asc" } }, { name: "asc" }] }),
    prisma.enrollment.findMany({ include: { student: { include: { person: true } }, school: true, schoolClass: true, period: true, movements: { orderBy: { effectiveDate: "desc" } } }, orderBy: { enrollmentDate: "desc" } }),
  ]);
  const classOptions = classes.map((item) => ({ value: item.id, label: `${item.school.name} · ${item.name} (${item._count.enrollments}/${item.capacity})` }));
  return <PageFrame className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden">
    <PageHeader title="Matrículas e movimentações" icon={<Users className="size-4 text-blue-600" />} />
    <div className="grid shrink-0 gap-2 xl:grid-cols-2">
      <S1ActionForm title="Nova matrícula" submitLabel="Efetivar matrícula" action={createEnrollmentAction} fields={[{ name: "studentId", label: "Aluno", type: "select", required: true, options: students.map((item) => ({ value: item.id, label: `${item.person.fullName} · ${item.studentCode}` })) }, { name: "classId", label: "Turma", type: "select", required: true, options: classOptions }, { name: "enrollmentDate", label: "Data da matrícula", type: "date", required: true }, { name: "notes", label: "Observação" }]} />
      <S1ActionForm title="Movimentar matrícula" submitLabel="Registrar movimentação" action={moveEnrollmentAction} fields={[{ name: "enrollmentId", label: "Matrícula", type: "select", required: true, options: enrollments.filter((item) => item.status === "Matriculado").map((item) => ({ value: item.id, label: `${item.student.person.fullName} · ${item.schoolClass?.name || "Sem turma"}` })) }, { name: "type", label: "Tipo", type: "select", required: true, options: ["Remanejamento", "Transferência", "Evasão", "Cancelamento"].map((value) => ({ value, label: value })) }, { name: "targetClassId", label: "Turma de destino", type: "select", options: classOptions }, { name: "effectiveDate", label: "Data de vigência", type: "date", required: true }, { name: "reason", label: "Motivo" }, { name: "destinationMunicipality", label: "Município de destino" }]} />
    </div>
    <div className="min-h-0 flex-1"><EducationListClient rows={enrollments.map((item) => ({ id: item.id, cells: { code: item.supportCode || "—", student: item.student.person.fullName, school: item.school.name, class: item.schoolClass?.name || "—", year: String(item.year), status: item.status }, detail: { Código: item.supportCode || "Não informado", Aluno: item.student.person.fullName, Escola: item.school.name, Período: item.period?.name || "Não vinculado", Turma: item.schoolClass?.name || "—", Ingresso: item.enrollmentDate.toLocaleDateString("pt-BR"), Situação: item.status, Histórico: item.movements.map((movement) => `${movement.effectiveDate.toLocaleDateString("pt-BR")} · ${movement.type}${movement.reason ? ` · ${movement.reason}` : ""}`).join("\n") || "Sem movimentações" } }))} columns={[{ key: "code", label: "Matrícula", width: "medium" }, { key: "student", label: "Aluno" }, { key: "school", label: "Escola" }, { key: "class", label: "Turma", width: "medium" }, { key: "year", label: "Ano", width: "narrow", align: "center" }, { key: "status", label: "Situação", width: "medium" }]} searchPlaceholder="Buscar matrícula, aluno, escola ou turma..." label="matrículas" filterKey="status" statusKey="status" detailTitleKey="student" actions={false} /></div>
  </PageFrame>;
}
