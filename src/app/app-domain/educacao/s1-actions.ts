"use server";

import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { intervalsOverlap, makeSupportCode, normalizeDigits, parseEducacensoFile, validateEducacensoRows, validateScheduleInterval } from "@/lib/educacao/s1";

export type EducationActionResult = { error: string | null; message?: string; download?: { fileName: string; content: string } };

const required = (data: FormData, name: string) => String(data.get(name) || "").trim();
const asDate = (value: string) => new Date(`${value}T12:00:00.000Z`);

function messageFor(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Não foi possível concluir a operação.";
}

function refreshEducation() {
  revalidatePath("/educacao");
  revalidatePath("/educacao/academico");
  revalidatePath("/educacao/alunos");
  revalidatePath("/educacao/matriculas");
  revalidatePath("/educacao/educacenso");
}

export async function createStudentAction(data: FormData): Promise<EducationActionResult> {
  try {
    const { prisma } = await getTenantContextForModuleOperation("EDUCACAO", "create");
    const personId = required(data, "personId");
    const studentCode = required(data, "studentCode");
    if (!personId || !studentCode) throw new Error("Pessoa e código do aluno são obrigatórios.");
    const guardianPersonId = required(data, "guardianPersonId");
    await prisma.student.create({
      data: {
        personId,
        studentCode,
        specialNeeds: required(data, "specialNeeds") || null,
        usesSchoolTransport: data.get("usesSchoolTransport") === "on",
        needsSpecialMeal: data.get("needsSpecialMeal") === "on",
        guardians: guardianPersonId ? { create: { personId: guardianPersonId, kinship: required(data, "kinship") || "Responsável" } } : undefined,
      },
    });
    refreshEducation();
    return { error: null, message: "Aluno vinculado ao cadastro único de pessoas." };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function createAcademicPeriodAction(data: FormData): Promise<EducationActionResult> {
  try {
    const { prisma } = await getTenantContextForModuleOperation("EDUCACAO", "create");
    const schoolId = required(data, "schoolId");
    const code = required(data, "code");
    const name = required(data, "name");
    const year = Number(required(data, "year"));
    const startDate = asDate(required(data, "startDate"));
    const endDate = asDate(required(data, "endDate"));
    if (!schoolId || !code || !name || !year || Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf())) throw new Error("Preencha os dados obrigatórios do período.");
    if (startDate >= endDate) throw new Error("O término deve ser posterior ao início.");
    await prisma.academicPeriod.create({ data: { schoolId, code, name, year, startDate, endDate, modality: required(data, "modality") || "Regular", resolution: required(data, "resolution") || null, minimumSchoolDays: Number(required(data, "minimumSchoolDays")) || 200 } });
    refreshEducation();
    return { error: null, message: "Período letivo criado." };
  } catch (error) { return { error: messageFor(error) }; }
}

export async function createCurriculumMatrixAction(data: FormData): Promise<EducationActionResult> {
  try {
    const { prisma } = await getTenantContextForModuleOperation("EDUCACAO", "create");
    const schoolId = required(data, "schoolId");
    const periodId = required(data, "periodId");
    const name = required(data, "name");
    const subjectName = required(data, "subjectName");
    if (!schoolId || !periodId || !name || !subjectName) throw new Error("Escola, período, matriz e componente são obrigatórios.");
    const subjectCode = required(data, "subjectCode") || undefined;
    await prisma.$transaction(async (tx) => {
      const subject = subjectCode
        ? await tx.schoolSubject.upsert({ where: { code: subjectCode }, create: { code: subjectCode, name: subjectName }, update: { name: subjectName, isActive: true } })
        : await tx.schoolSubject.create({ data: { name: subjectName } });
      await tx.curriculumMatrix.create({ data: { schoolId, periodId, name, stage: required(data, "stage"), grade: required(data, "grade"), annualWorkload: Number(required(data, "annualWorkload")) || 800, subjects: { create: { subjectId: subject.id, workload: Number(required(data, "subjectWorkload")) || 80, weeklyLessons: Number(required(data, "weeklyLessons")) || 2 } } } });
    });
    refreshEducation();
    return { error: null, message: "Matriz curricular criada com o primeiro componente." };
  } catch (error) { return { error: messageFor(error) }; }
}

export async function createSchoolClassAction(data: FormData): Promise<EducationActionResult> {
  try {
    const { prisma } = await getTenantContextForModuleOperation("EDUCACAO", "create");
    const periodId = required(data, "periodId");
    const matrixId = required(data, "matrixId");
    const period = await prisma.academicPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new Error("Período letivo não encontrado.");
    await prisma.schoolClass.create({ data: { schoolId: period.schoolId, periodId, matrixId: matrixId || null, name: required(data, "name"), year: period.year, stage: required(data, "stage"), grade: required(data, "grade"), shift: required(data, "shift"), room: required(data, "room") || null, capacity: Number(required(data, "capacity")) || 30, classType: required(data, "classType") || "Regular", groupingType: required(data, "groupingType") || "Disciplina", annualWorkload: Number(required(data, "annualWorkload")) || null, annualLessons: Number(required(data, "annualLessons")) || null, lessonMinutes: Number(required(data, "lessonMinutes")) || null } });
    refreshEducation();
    return { error: null, message: "Turma criada." };
  } catch (error) { return { error: messageFor(error) }; }
}

export async function assignTeacherSubjectAction(data: FormData): Promise<EducationActionResult> {
  try {
    const { prisma } = await getTenantContextForModuleOperation("EDUCACAO", "create");
    await prisma.teacherClassAssignment.create({ data: { classId: required(data, "classId"), teacherId: required(data, "teacherId"), subjectId: required(data, "subjectId"), role: required(data, "role") || "Docente", startDate: asDate(required(data, "startDate")) } });
    refreshEducation();
    return { error: null, message: "Professor e componente vinculados à turma." };
  } catch (error) { return { error: messageFor(error) }; }
}

export async function createEnrollmentAction(data: FormData): Promise<EducationActionResult> {
  try {
    const { prisma, user } = await getTenantContextForModuleOperation("EDUCACAO", "create");
    const studentId = required(data, "studentId");
    const classId = required(data, "classId");
    await prisma.$transaction(async (tx) => {
      const schoolClass = await tx.schoolClass.findUnique({ where: { id: classId }, include: { period: true, _count: { select: { enrollments: { where: { status: "Matriculado" } } } } } });
      const student = await tx.student.findUnique({ where: { id: studentId } });
      if (!schoolClass || !student || !schoolClass.period) throw new Error("Aluno, turma ou período letivo não encontrado.");
      if (schoolClass.status !== "Aberta") throw new Error("A turma não está aberta para matrículas.");
      if (schoolClass._count.enrollments >= schoolClass.capacity) throw new Error("A turma atingiu a capacidade cadastrada.");
      const active = await tx.enrollment.findFirst({ where: { studentId, year: schoolClass.year, status: "Matriculado" } });
      if (active) throw new Error("O aluno já possui matrícula ativa neste ano letivo.");
      await tx.enrollment.create({ data: { studentId, classId, schoolId: schoolClass.schoolId, periodId: schoolClass.periodId, year: schoolClass.year, supportCode: makeSupportCode(schoolClass.year, student.studentCode), enrollmentDate: asDate(required(data, "enrollmentDate")), movements: { create: { type: "Matrícula", effectiveDate: asDate(required(data, "enrollmentDate")), targetClassId: classId, actorName: user.name, notes: required(data, "notes") || null } } } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    refreshEducation();
    return { error: null, message: "Matrícula efetivada com histórico inicial." };
  } catch (error) { return { error: messageFor(error) }; }
}

export async function moveEnrollmentAction(data: FormData): Promise<EducationActionResult> {
  try {
    const { prisma, user } = await getTenantContextForModuleOperation("EDUCACAO", "update");
    const enrollmentId = required(data, "enrollmentId");
    const type = required(data, "type");
    const targetClassId = required(data, "targetClassId") || null;
    await prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.findUnique({ where: { id: enrollmentId } });
      if (!enrollment) throw new Error("Matrícula não encontrada.");
      if (type === "Remanejamento") {
        if (!targetClassId) throw new Error("Informe a turma de destino.");
        const target = await tx.schoolClass.findUnique({ where: { id: targetClassId }, include: { _count: { select: { enrollments: { where: { status: "Matriculado" } } } } } });
        if (!target || target.year !== enrollment.year || target.schoolId !== enrollment.schoolId) throw new Error("A turma de destino deve pertencer à mesma escola e ano.");
        if (target._count.enrollments >= target.capacity) throw new Error("A turma de destino não possui vaga.");
        await tx.enrollment.update({ where: { id: enrollmentId }, data: { classId: targetClassId } });
      } else if (["Transferência", "Evasão", "Cancelamento"].includes(type)) {
        await tx.enrollment.update({ where: { id: enrollmentId }, data: { status: type === "Transferência" ? "Transferido" : type === "Evasão" ? "Evadido" : "Cancelado", endDate: asDate(required(data, "effectiveDate")) } });
      } else throw new Error("Tipo de movimentação inválido.");
      await tx.enrollmentMovement.create({ data: { enrollmentId, type, effectiveDate: asDate(required(data, "effectiveDate")), sourceClassId: enrollment.classId, targetClassId, reason: required(data, "reason") || null, destinationMunicipality: required(data, "destinationMunicipality") || null, actorName: user.name } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    refreshEducation();
    return { error: null, message: "Movimentação registrada sem perder o histórico da matrícula." };
  } catch (error) { return { error: messageFor(error) }; }
}

export async function createScheduleEntryAction(data: FormData): Promise<EducationActionResult> {
  try {
    const { prisma } = await getTenantContextForModuleOperation("EDUCACAO", "create");
    const classId = required(data, "classId");
    const startTime = required(data, "startTime");
    const endTime = required(data, "endTime");
    const weekday = Number(required(data, "weekday"));
    if (!validateScheduleInterval(startTime, endTime)) throw new Error("Informe um intervalo de horário válido.");
    let board = await prisma.classScheduleBoard.findFirst({ where: { classId, status: "Rascunho" }, include: { entries: true } });
    if (!board) {
      const schoolClass = await prisma.schoolClass.findUnique({ where: { id: classId } });
      if (!schoolClass?.periodId) throw new Error("A turma precisa estar vinculada a um período.");
      board = await prisma.classScheduleBoard.create({ data: { classId, periodId: schoolClass.periodId, name: `Horário ${schoolClass.year}`, startDate: new Date(), status: "Rascunho" }, include: { entries: true } });
    }
    const conflict = board.entries.some((entry) => entry.weekday === weekday && intervalsOverlap(startTime, endTime, entry.startTime, entry.endTime));
    if (conflict) throw new Error("Existe conflito com outro horário desta turma.");
    await prisma.classScheduleEntry.create({ data: { boardId: board.id, subjectId: required(data, "subjectId"), teacherId: required(data, "teacherId") || null, weekday, lessonOrder: Number(required(data, "lessonOrder")), startTime, endTime } });
    refreshEducation();
    return { error: null, message: "Aula adicionada ao quadro de horários." };
  } catch (error) { return { error: messageFor(error) }; }
}

export async function processEducacensoImportAction(data: FormData): Promise<EducationActionResult> {
  try {
    const { prisma, user } = await getTenantContextForModuleOperation("EDUCACAO", "create");
    const fileName = required(data, "fileName");
    const content = required(data, "content");
    const competence = required(data, "competence");
    const layoutVersion = required(data, "layoutVersion");
    if (!fileName || !content || !competence || !layoutVersion) throw new Error("Arquivo, competência e versão do leiaute são obrigatórios.");
    const checksum = createHash("sha256").update(content).digest("hex");
    const previous = await prisma.educacensoOperation.findFirst({ where: { operationType: "Importação", competence, checksum, status: "Processado" } });
    if (previous) {
      await prisma.educacensoOperation.create({ data: { operationType: "Importação", competence, layoutVersion, fileName, checksum, status: "Ignorado", recordsRead: previous.recordsRead, ignoredRecords: previous.recordsRead, actorName: user.name, issues: [{ message: "Arquivo já processado para esta competência." }] } });
      refreshEducation();
      return { error: null, message: "Arquivo já processado; a repetição foi registrada e ignorada." };
    }
    const rows = parseEducacensoFile(content);
    const issues = validateEducacensoRows(rows);
    let updatedRecords = 0;
    for (const row of rows) {
      if (issues.some((issue) => issue.line === row.line)) continue;
      if (row.type === "ESCOLA") {
        const [inepCode, name] = row.fields;
        await prisma.school.upsert({ where: { inepCode }, create: { inepCode, name }, update: { name, isActive: true } });
        updatedRecords += 1;
      } else if (row.type === "ESTUDANTE") {
        const [studentCode, fullName, rawCpf] = row.fields;
        const cpf = normalizeDigits(rawCpf || "");
        if (cpf.length !== 11) { issues.push({ line: row.line, message: "CPF do estudante ausente ou inválido." }); continue; }
        const person = await prisma.person.upsert({ where: { cpf }, create: { cpf, fullName }, update: { fullName, status: "Ativo" } });
        await prisma.student.upsert({ where: { studentCode }, create: { studentCode, personId: person.id }, update: { status: "Ativo" } });
        updatedRecords += 1;
      } else {
        issues.push({ line: row.line, message: `${row.type} validado; vínculo depende dos cadastros funcionais e acadêmicos correspondentes.` });
      }
    }
    await prisma.educacensoOperation.create({ data: { operationType: "Importação", competence, layoutVersion, fileName, checksum, status: issues.length ? "Processado com críticas" : "Processado", recordsRead: rows.length, validRecords: rows.length - new Set(issues.map((item) => item.line)).size, updatedRecords, inconsistentRecords: new Set(issues.map((item) => item.line)).size, issues, actorName: user.name } });
    refreshEducation();
    return { error: null, message: `${rows.length} registros lidos, ${updatedRecords} atualizados e ${new Set(issues.map((item) => item.line)).size} com críticas.` };
  } catch (error) { return { error: messageFor(error) }; }
}

export async function generateEducacensoExportAction(data: FormData): Promise<EducationActionResult> {
  try {
    const { prisma, user } = await getTenantContextForModuleOperation("EDUCACAO", "issueReports");
    const competence = required(data, "competence");
    const layoutVersion = required(data, "layoutVersion");
    const exportType = required(data, "exportType");
    const enrollments = await prisma.enrollment.findMany({ include: { student: { include: { person: true } }, school: true, schoolClass: true }, orderBy: [{ school: { name: "asc" } }, { student: { person: { fullName: "asc" } } }] });
    const lines = enrollments.map((item) => [exportType, item.school.inepCode || item.school.id, item.student.studentCode, item.student.person.fullName, item.schoolClass?.name || "", item.status].join(";"));
    const content = lines.join("\n");
    const fileName = `educacenso-${exportType.toLowerCase().replace(/\s/g, "-")}-${competence}.txt`;
    await prisma.educacensoOperation.create({ data: { operationType: `Exportação - ${exportType}`, competence, layoutVersion, fileName, checksum: createHash("sha256").update(content).digest("hex"), status: "Gerado", recordsRead: lines.length, validRecords: lines.length, generatedContent: content, actorName: user.name } });
    refreshEducation();
    return { error: null, message: `${lines.length} registros preparados para conferência.`, download: { fileName, content } };
  } catch (error) { return { error: messageFor(error) }; }
}
