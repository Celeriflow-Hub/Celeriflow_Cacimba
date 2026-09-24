import { UserRoundCheck } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { EducationListClient } from "../EducationListClient";
import { S1ActionForm } from "../S1ActionForm";
import { createStudentAction } from "../s1-actions";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const { prisma } = await getTenantContextForModule("EDUCACAO");
  const [students, availablePeople, people] = await Promise.all([
    prisma.student.findMany({ include: { person: true, guardians: { include: { person: true } }, enrollments: { where: { status: "Matriculado" }, include: { school: true, schoolClass: true }, take: 1 } }, orderBy: { person: { fullName: "asc" } } }),
    prisma.person.findMany({ where: { studentInfo: null, status: "Ativo" }, orderBy: { fullName: "asc" }, take: 500 }),
    prisma.person.findMany({ where: { status: "Ativo" }, orderBy: { fullName: "asc" }, take: 500 }),
  ]);
  return <PageFrame className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden">
    <PageHeader title="Alunos e responsáveis" icon={<UserRoundCheck className="size-4 text-blue-600" />} />
    <S1ActionForm title="Vincular aluno ao cadastro único" description="Selecione pessoas já cadastradas para evitar duplicidade de identidade." submitLabel="Vincular aluno" action={createStudentAction} fields={[{ name: "personId", label: "Pessoa", type: "select", required: true, options: availablePeople.map((item) => ({ value: item.id, label: `${item.fullName} · CPF ${item.cpf}` })) }, { name: "studentCode", label: "Código do aluno", required: true }, { name: "guardianPersonId", label: "Responsável", type: "select", options: people.map((item) => ({ value: item.id, label: item.fullName })) }, { name: "kinship", label: "Parentesco" }, { name: "specialNeeds", label: "Necessidades específicas" }, { name: "usesSchoolTransport", label: "Utiliza transporte escolar", type: "checkbox" }, { name: "needsSpecialMeal", label: "Necessita alimentação especial", type: "checkbox" }]} />
    <div className="min-h-0 flex-1"><EducationListClient rows={students.map((item) => ({ id: item.id, cells: { code: item.studentCode, name: item.person.fullName, cpf: item.person.cpf, school: item.enrollments[0]?.school.name || "Sem matrícula ativa", class: item.enrollments[0]?.schoolClass?.name || "—", status: item.status }, detail: { Código: item.studentCode, Nome: item.person.fullName, CPF: item.person.cpf, Responsáveis: item.guardians.map((guardian) => `${guardian.person.fullName} (${guardian.kinship})`).join("; ") || "Não informado", Escola: item.enrollments[0]?.school.name || "Sem matrícula ativa", Turma: item.enrollments[0]?.schoolClass?.name || "—", Transporte: item.usesSchoolTransport ? "Sim" : "Não", "Alimentação especial": item.needsSpecialMeal ? "Sim" : "Não", Situação: item.status } }))} columns={[{ key: "code", label: "Código", width: "medium" }, { key: "name", label: "Aluno" }, { key: "cpf", label: "CPF", responsive: "lg" }, { key: "school", label: "Escola" }, { key: "class", label: "Turma", width: "medium" }, { key: "status", label: "Situação", width: "medium" }]} searchPlaceholder="Buscar aluno, CPF, código, escola ou turma..." label="alunos" filterKey="status" statusKey="status" detailTitleKey="name" actions={false} /></div>
  </PageFrame>;
}
