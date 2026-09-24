import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const schools = await prisma.school.findMany({ orderBy: { name: "asc" } });
  if (!schools.length) throw new Error("Cadastre ou importe as escolas antes de preparar o núcleo acadêmico.");
  const subjects = await Promise.all([
    ["LP", "Língua Portuguesa"], ["MAT", "Matemática"], ["CIE", "Ciências"], ["HIS", "História"], ["GEO", "Geografia"],
  ].map(([code, name]) => prisma.schoolSubject.upsert({ where: { code }, create: { code, name }, update: { name, isActive: true } })));
  for (const school of schools) {
    const period = await prisma.academicPeriod.upsert({
      where: { schoolId_code: { schoolId: school.id, code: "2026-REG" } },
      create: { schoolId: school.id, code: "2026-REG", name: "Ano letivo 2026", year: 2026, modality: "Regular", startDate: new Date("2026-02-05T12:00:00Z"), endDate: new Date("2026-12-18T12:00:00Z"), status: "Em andamento" },
      update: { status: "Em andamento" },
    });
    await prisma.schoolShift.upsert({ where: { schoolId_name: { schoolId: school.id, name: "Manhã" } }, create: { schoolId: school.id, name: "Manhã", type: "Parcial", startTime: "07:30", endTime: "12:00", weekdays: [1, 2, 3, 4, 5] }, update: { isActive: true } });
    const matrix = await prisma.curriculumMatrix.upsert({ where: { schoolId_periodId_name_version: { schoolId: school.id, periodId: period.id, name: "Ensino Fundamental - Anos Iniciais", version: 1 } }, create: { schoolId: school.id, periodId: period.id, name: "Ensino Fundamental - Anos Iniciais", stage: "Ensino Fundamental", grade: "1º ao 5º Ano", annualWorkload: 800 }, update: { status: "Ativa" } });
    for (const subject of subjects) await prisma.curriculumMatrixSubject.upsert({ where: { matrixId_subjectId: { matrixId: matrix.id, subjectId: subject.id } }, create: { matrixId: matrix.id, subjectId: subject.id, workload: 160, weeklyLessons: 4 }, update: { workload: 160, weeklyLessons: 4 } });
    const classes = await prisma.schoolClass.findMany({ where: { schoolId: school.id, year: 2026 } });
    for (const schoolClass of classes) {
      await prisma.schoolClass.update({ where: { id: schoolClass.id }, data: { periodId: period.id, matrixId: schoolClass.matrixId || matrix.id } });
      const enrollments = await prisma.enrollment.findMany({ where: { classId: schoolClass.id } });
      for (const enrollment of enrollments) {
        await prisma.enrollment.update({ where: { id: enrollment.id }, data: { periodId: period.id, supportCode: enrollment.supportCode || `MAT-${enrollment.year}-${enrollment.id.slice(-8).toUpperCase()}` } });
        const existing = await prisma.enrollmentMovement.findFirst({ where: { enrollmentId: enrollment.id, type: "Matrícula" } });
        if (!existing) await prisma.enrollmentMovement.create({ data: { enrollmentId: enrollment.id, type: "Matrícula", effectiveDate: enrollment.enrollmentDate, targetClassId: schoolClass.id, actorName: "Carga acadêmica" } });
      }
    }
  }
  console.log(`Núcleo acadêmico preparado para ${schools.length} escola(s).`);
}

main().finally(() => prisma.$disconnect());
