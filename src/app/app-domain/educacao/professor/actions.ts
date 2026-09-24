"use server";

import { revalidatePath } from "next/cache";
import { getTenantContextForModuleOperation, isSystemAdministrator } from "@/lib/platform/tenant-context";

export type ProfessorActionResult = { error: string | null; message?: string };
const value = (data: FormData, key: string) => String(data.get(key) || "").trim();
const date = (raw: string) => new Date(`${raw}T12:00:00.000Z`);
const message = (error: unknown) => error instanceof Error ? error.message : "Não foi possível concluir a operação.";
const refresh = () => { revalidatePath("/educacao/professor"); revalidatePath("/educacao"); };

async function contextForTeacher(data: FormData, operation: "create" | "update") {
  const context = await getTenantContextForModuleOperation("EDUCACAO", operation);
  const teacherId = value(data, "teacherId");
  const teacher = await context.prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) throw new Error("Professor não encontrado.");
  if (!isSystemAdministrator(context.user) && context.user.employeeId !== teacher.employeeId) throw new Error("Acesso restrito ao diário do professor autenticado.");
  return { ...context, teacherId };
}

async function assertAssignment(prisma: Awaited<ReturnType<typeof getTenantContextForModuleOperation>>["prisma"], teacherId: string, classId: string, subjectId?: string) {
  const assignment = await prisma.teacherClassAssignment.findFirst({ where: { teacherId, classId, isActive: true, ...(subjectId ? { subjectId } : {}) } });
  const direct = await prisma.schoolClass.findFirst({ where: { id: classId, teacherId } });
  if (!assignment && !direct) throw new Error("Professor sem vínculo ativo com a turma e o componente selecionados.");
}

export async function saveDiaryAction(data: FormData): Promise<ProfessorActionResult> {
  try {
    const { prisma, teacherId } = await contextForTeacher(data, "create");
    const classId = value(data, "classId"), subjectId = value(data, "subjectId"), rawDate = value(data, "date");
    await assertAssignment(prisma, teacherId, classId, subjectId);
    const entries = JSON.parse(value(data, "attendances") || "[]") as { studentId: string; isPresent: boolean; absenceGroup?: string; justification?: string }[];
    const enrolled = await prisma.enrollment.findMany({ where: { classId, status: "Matriculado" }, select: { studentId: true } });
    const allowed = new Set(enrolled.map((item) => item.studentId));
    if (!entries.length || entries.some((item) => !allowed.has(item.studentId))) throw new Error("A lista de chamada não corresponde à turma selecionada.");
    await prisma.$transaction(async (tx) => {
      const existing = await tx.classDiary.findFirst({ where: { classId, subjectId, teacherId, date: date(rawDate) } });
      if (existing?.status === "Fechado") throw new Error("O diário está fechado. Reabra antes de alterar.");
      const diary = existing ? await tx.classDiary.update({ where: { id: existing.id }, data: { contentTaught: value(data, "contentTaught"), observations: value(data, "observations") || null, stage: value(data, "stage"), lessonCount: Number(value(data, "lessonCount")) || 1 } }) : await tx.classDiary.create({ data: { classId, subjectId, teacherId, date: date(rawDate), contentTaught: value(data, "contentTaught"), observations: value(data, "observations") || null, stage: value(data, "stage"), lessonCount: Number(value(data, "lessonCount")) || 1 } });
      for (const item of entries) await tx.attendance.upsert({ where: { id: `${diary.id}-${item.studentId}` }, create: { id: `${diary.id}-${item.studentId}`, diaryId: diary.id, studentId: item.studentId, isPresent: item.isPresent, absenceGroup: item.absenceGroup || null, justification: item.justification || null }, update: { isPresent: item.isPresent, absenceGroup: item.absenceGroup || null, justification: item.justification || null } });
    });
    refresh(); return { error: null, message: "Chamada e conteúdo salvos." };
  } catch (error) { return { error: message(error) }; }
}

export async function setDiaryStatusAction(data: FormData): Promise<ProfessorActionResult> {
  try {
    const { prisma, teacherId } = await contextForTeacher(data, "update");
    const diary = await prisma.classDiary.findFirst({ where: { id: value(data, "diaryId"), teacherId } });
    if (!diary) throw new Error("Diário não encontrado.");
    const close = value(data, "status") === "Fechado";
    await prisma.classDiary.update({ where: { id: diary.id }, data: { status: close ? "Fechado" : "Aberto", publishedAt: close ? new Date() : null, reopenedAt: close ? diary.reopenedAt : new Date() } });
    refresh(); return { error: null, message: close ? "Diário fechado e publicado." : "Diário reaberto." };
  } catch (error) { return { error: message(error) }; }
}

export async function createAssessmentAction(data: FormData): Promise<ProfessorActionResult> {
  try {
    const { prisma, teacherId } = await contextForTeacher(data, "create");
    const classId = value(data, "classId"), subjectId = value(data, "subjectId"), maxScore = Number(value(data, "maxScore")) || null;
    await assertAssignment(prisma, teacherId, classId, subjectId);
    if (maxScore) { const used = await prisma.educationAssessment.aggregate({ where: { classId, subjectId, stage: value(data, "stage"), status: { not: "Cancelada" } }, _sum: { maxScore: true } }); if ((used._sum.maxScore || 0) + maxScore > 100) throw new Error("A pontuação total da etapa não pode ultrapassar 100 pontos."); }
    await prisma.educationAssessment.create({ data: { teacherId, classId, subjectId, title: value(data, "title"), stage: value(data, "stage"), type: value(data, "type"), evaluationMode: value(data, "evaluationMode"), date: date(value(data, "date")), maxScore, averageScore: Number(value(data, "averageScore")) || null, content: value(data, "content") || null } });
    refresh(); return { error: null, message: "Avaliação criada." };
  } catch (error) { return { error: message(error) }; }
}

export async function saveGradesAction(data: FormData): Promise<ProfessorActionResult> {
  try {
    const { prisma, teacherId } = await contextForTeacher(data, "update");
    const assessment = await prisma.educationAssessment.findFirst({ where: { id: value(data, "assessmentId"), teacherId } });
    if (!assessment) throw new Error("Avaliação não encontrada.");
    if (assessment.status === "Fechada") throw new Error("A avaliação está fechada.");
    const grades = JSON.parse(value(data, "grades") || "[]") as { studentId: string; value?: number | null; concept?: string; absent?: boolean; recoveryValue?: number | null; feedback?: string }[];
    for (const item of grades) await prisma.grade.upsert({ where: { assessmentId_studentId: { assessmentId: assessment.id, studentId: item.studentId } }, create: { assessmentId: assessment.id, studentId: item.studentId, classId: assessment.classId, subjectId: assessment.subjectId, teacherId, period: assessment.stage, type: "Avaliação", value: item.value ?? null, concept: item.concept || null, absent: Boolean(item.absent), recoveryValue: item.recoveryValue ?? null, feedback: item.feedback || null }, update: { value: item.value ?? null, concept: item.concept || null, absent: Boolean(item.absent), recoveryValue: item.recoveryValue ?? null, feedback: item.feedback || null } });
    refresh(); return { error: null, message: "Resultados e recuperação salvos." };
  } catch (error) { return { error: message(error) }; }
}

export async function publishAssessmentAction(data: FormData): Promise<ProfessorActionResult> {
  try { const { prisma, teacherId } = await contextForTeacher(data, "update"); const item = await prisma.educationAssessment.findFirst({ where: { id: value(data, "assessmentId"), teacherId } }); if (!item) throw new Error("Avaliação não encontrada."); const close = value(data, "status") === "Fechada"; await prisma.$transaction([prisma.educationAssessment.update({ where: { id: item.id }, data: { status: close ? "Fechada" : "Publicada", publishedAt: new Date() } }), prisma.grade.updateMany({ where: { assessmentId: item.id }, data: { publishedAt: new Date() } })]); refresh(); return { error: null, message: close ? "Avaliação fechada." : "Resultados publicados." }; } catch (error) { return { error: message(error) }; }
}

export async function createAcademicRecordAction(data: FormData): Promise<ProfessorActionResult> {
  try { const { prisma, teacherId } = await contextForTeacher(data, "create"); const classId=value(data,"classId"), subjectId=value(data,"subjectId") || undefined; await assertAssignment(prisma,teacherId,classId,subjectId); await prisma.teacherAcademicRecord.create({ data: { teacherId,classId,subjectId,title:value(data,"title"),type:value(data,"type"),stage:value(data,"stage")||null,startDate:date(value(data,"startDate")),endDate:value(data,"endDate")?date(value(data,"endDate")):null,content:{ objectives:value(data,"objectives"),methodology:value(data,"methodology"),resources:value(data,"resources"),assessment:value(data,"assessment") },status:value(data,"publish")==="on"?"Publicado":"Rascunho",publishedAt:value(data,"publish")==="on"?new Date():null } }); refresh(); return {error:null,message:"Registro pedagógico salvo."}; } catch(error){return {error:message(error)}}
}

export async function createActivityAction(data: FormData): Promise<ProfessorActionResult> {
  try { const { prisma, teacherId }=await contextForTeacher(data,"create"); const classId=value(data,"classId"),subjectId=value(data,"subjectId"); await assertAssignment(prisma,teacherId,classId,subjectId); await prisma.learningActivity.create({data:{teacherId,classId,subjectId,title:value(data,"title"),type:value(data,"type"),instructions:value(data,"instructions"),materialUrl:value(data,"materialUrl")||null,dueAt:value(data,"dueAt")?new Date(value(data,"dueAt")):null,status:value(data,"publish")==="on"?"Publicada":"Rascunho",publishedAt:value(data,"publish")==="on"?new Date():null,questions:value(data,"question")?{create:{statement:value(data,"question"),type:value(data,"questionType")||"Discursiva",options:value(data,"options")?value(data,"options").split("|"):undefined,answerKey:value(data,"answerKey")||null,points:Number(value(data,"points"))||null}}:undefined}}); refresh(); return {error:null,message:"Atividade salva."}; } catch(error){return {error:message(error)}}
}

export async function reviewSubmissionAction(data: FormData): Promise<ProfessorActionResult> {
  try { const {prisma,teacherId}=await contextForTeacher(data,"update"); const submission=await prisma.learningSubmission.findFirst({where:{id:value(data,"submissionId"),activity:{teacherId}}}); if(!submission) throw new Error("Entrega não encontrada."); await prisma.learningSubmission.update({where:{id:submission.id},data:{score:Number(value(data,"score"))||null,feedback:value(data,"feedback"),status:"Corrigida",reviewedAt:new Date()}}); refresh(); return {error:null,message:"Correção e retorno registrados."}; } catch(error){return {error:message(error)}}
}
