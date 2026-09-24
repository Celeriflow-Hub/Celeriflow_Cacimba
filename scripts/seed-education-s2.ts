import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main(){
  let assignments=await prisma.teacherClassAssignment.findMany({where:{isActive:true},include:{schoolClass:{include:{enrollments:{where:{status:"Matriculado"}}}},subject:true,teacher:true},orderBy:{createdAt:"asc"}});
  if(!assignments.length){
    const direct=await prisma.schoolClass.findMany({where:{teacherId:{not:null},matrixId:{not:null}},include:{teacher:true,matrix:{include:{subjects:{include:{subject:true}}}},enrollments:{where:{status:"Matriculado"}}}});
    for(const item of direct){const component=item.matrix?.subjects[0];if(item.teacher&&component) await prisma.teacherClassAssignment.upsert({where:{classId_teacherId_subjectId_startDate:{classId:item.id,teacherId:item.teacher.id,subjectId:component.subjectId,startDate:new Date(`${item.year}-02-01T12:00:00Z`)}},create:{classId:item.id,teacherId:item.teacher.id,subjectId:component.subjectId,startDate:new Date(`${item.year}-02-01T12:00:00Z`)},update:{isActive:true}})}
    assignments=await prisma.teacherClassAssignment.findMany({where:{isActive:true},include:{schoolClass:{include:{enrollments:{where:{status:"Matriculado"}}}},subject:true,teacher:true},orderBy:{createdAt:"asc"}});
  }
  for(const assignment of assignments){
    const key=`S2-${assignment.classId.slice(-6)}-${assignment.subjectId.slice(-6)}`;
    const title=`Avaliação diagnóstica ${key}`;
    let assessment=await prisma.educationAssessment.findFirst({where:{teacherId:assignment.teacherId,classId:assignment.classId,subjectId:assignment.subjectId,title}});
    assessment ||= await prisma.educationAssessment.create({data:{teacherId:assignment.teacherId,classId:assignment.classId,subjectId:assignment.subjectId,title,stage:"1º Bimestre",type:"Diagnóstica",evaluationMode:"Nota",date:new Date("2026-03-12T12:00:00Z"),maxScore:10,averageScore:6,status:"Publicada",publishedAt:new Date("2026-03-15T12:00:00Z")}});
    for(const [index,enrollment] of assignment.schoolClass.enrollments.entries()) await prisma.grade.upsert({where:{assessmentId_studentId:{assessmentId:assessment.id,studentId:enrollment.studentId}},create:{assessmentId:assessment.id,classId:assignment.classId,studentId:enrollment.studentId,subjectId:assignment.subjectId,teacherId:assignment.teacherId,period:"1º Bimestre",value:7+(index%3),publishedAt:new Date("2026-03-15T12:00:00Z")},update:{}});
    const activityTitle=`Leitura orientada ${key}`;
    let activity=await prisma.learningActivity.findFirst({where:{teacherId:assignment.teacherId,classId:assignment.classId,title:activityTitle}});
    activity ||= await prisma.learningActivity.create({data:{teacherId:assignment.teacherId,classId:assignment.classId,subjectId:assignment.subjectId,title:activityTitle,type:"Atividade",instructions:"Leia o material indicado e registre as ideias principais.",dueAt:new Date("2026-03-25T20:00:00Z"),status:"Publicada",publishedAt:new Date("2026-03-18T12:00:00Z"),questions:{create:{statement:"Quais foram as ideias principais do texto?",type:"Discursiva",points:10}}}});
    const first=assignment.schoolClass.enrollments[0]; if(first) await prisma.learningSubmission.upsert({where:{activityId_studentId:{activityId:activity.id,studentId:first.studentId}},create:{activityId:activity.id,studentId:first.studentId,answer:"O texto apresenta o tema central e seus exemplos.",status:"Entregue"},update:{}});
  }
  console.log(`Operação do professor preparada para ${assignments.length} vínculo(s).`);
}
main().finally(()=>prisma.$disconnect());
