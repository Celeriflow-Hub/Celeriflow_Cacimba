import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('\n🚀 Iniciando seed do Módulo 12 (Educação)...\n');

  // --- PRE-REQUISITES (Módulo 1: Adm / Módulo 2: Cadastros / Módulo 11: Almoxarifado) ---
  console.log('Verificando pré-requisitos e integrações...');

  // 1. Secretaria de Educação
  let sec = await prisma.secretariat.findFirst({ where: { name: 'Secretaria de Educação' } });
  if (!sec) {
    sec = await prisma.secretariat.create({
      data: { name: 'Secretaria de Educação', acronym: 'SME', managerName: 'Maria Silva' }
    });
  }

  // 2. Departamento
  let dep = await prisma.department.findFirst({ where: { secretariatId: sec.id } });
  if (!dep) {
    dep = await prisma.department.create({
      data: { name: 'Departamento de Ensino Fundamental', secretariatId: sec.id }
    });
  }

  // 3. Pessoa Genérica para Estudantes e Servidores se não houver
  async function ensurePerson(cpf: string, fullName: string) {
    let p = await prisma.person.findFirst({ where: { cpf } });
    if (!p) {
      p = await prisma.person.create({
        data: { fullName, cpf, status: 'Ativo' }
      });
    }
    return p;
  }

  const pDirector1 = await ensurePerson('11111111111', 'Ana Clara Ferreira (Diretora)');
  const pDirector2 = await ensurePerson('22222222222', 'Marcos Ribeiro (Diretor)');
  const pTeacher1 = await ensurePerson('33333333333', 'Juliana Santos (Professora)');
  const pStudent1 = await ensurePerson('44444444444', 'Lucas Ferreira Almeida');
  const pStudent2 = await ensurePerson('55555555555', 'Mariana Costa Lima');
  const pStudent3 = await ensurePerson('66666666666', 'Pedro Henrique Souza');

  // 4. Cargos
  const roleDirector = await prisma.role.findFirst({ where: { name: 'Diretor Escolar' } }) || 
    await prisma.role.create({ data: { name: 'Diretor Escolar', level: 'Diretor' } });
  const roleTeacher = await prisma.role.findFirst({ where: { name: 'Professor Titular' } }) || 
    await prisma.role.create({ data: { name: 'Professor Titular', level: 'Servidor' } });

  // 5. Servidores (Integração RH)
  async function ensureEmployee(cpf: string, name: string, roleId: string, personId: string) {
    let e = await prisma.employee.findFirst({ where: { cpf } });
    if (!e) {
      e = await prisma.employee.create({
        data: { name, cpf, roleId, personId, secretariatId: sec!.id, departmentId: dep!.id }
      });
    }
    return e;
  }

  const empDir1 = await ensureEmployee('11111111111', 'Ana Clara Ferreira', roleDirector.id, pDirector1.id);
  const empDir2 = await ensureEmployee('22222222222', 'Marcos Ribeiro', roleDirector.id, pDirector2.id);
  const empTeacher = await ensureEmployee('33333333333', 'Juliana Santos', roleTeacher.id, pTeacher1.id);

  // 6. Almoxarifado para Merenda (Integração Módulo 11)
  let warehouse = await prisma.warehouse.findFirst({ where: { name: 'Almoxarifado Central de Merenda' } });
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: { name: 'Almoxarifado Central de Merenda', type: 'Central' }
    });
  }

  console.log('✅ Pré-requisitos garantidos.');

  // --- SEED MÓDULO 12: EDUCAÇÃO ---
  console.log('Criando dados do Módulo 12...');

  // 1. Escolas
  const school1 = await prisma.school.upsert({
    where: { inepCode: '12345601' },
    update: {},
    create: {
      name: 'Escola Municipal Machado de Assis',
      inepCode: '12345601',
      capacity: 500,
      directorId: empDir1.id,
      phone: '(11) 3333-4444',
      email: 'em.machadodeassis@municipio.gov.br'
    }
  });

  const school2 = await prisma.school.upsert({
    where: { inepCode: '12345602' },
    update: {},
    create: {
      name: 'Centro de Educação Infantil Monteiro Lobato',
      inepCode: '12345602',
      capacity: 200,
      directorId: empDir2.id,
      phone: '(11) 3333-5555',
      email: 'cei.monteirolobato@municipio.gov.br'
    }
  });

  console.log('✅ 2 Escolas criadas.');

  // 2. Professor (Módulo 12 table)
  let teacher = await prisma.teacher.findFirst({ where: { employeeId: empTeacher.id } });
  if (!teacher) {
    teacher = await prisma.teacher.create({
      data: { employeeId: empTeacher.id }
    });
  }

  // 3. Turmas
  const class1 = await prisma.schoolClass.findFirst({ where: { name: '1º Ano A', schoolId: school1.id } }) ||
    await prisma.schoolClass.create({
      data: {
        name: '1º Ano A', year: 2026, stage: 'Ensino Fundamental', grade: '1º Ano',
        shift: 'Manhã', capacity: 30, schoolId: school1.id, teacherId: teacher.id
      }
    });

  const class2 = await prisma.schoolClass.findFirst({ where: { name: 'Creche II B', schoolId: school2.id } }) ||
    await prisma.schoolClass.create({
      data: {
        name: 'Creche II B', year: 2026, stage: 'Educação Infantil', grade: 'Creche II',
        shift: 'Integral', capacity: 20, schoolId: school2.id, teacherId: teacher.id
      }
    });

  console.log('✅ 2 Turmas criadas.');

  // 4. Alunos e Matrículas
  async function ensureStudent(studentCode: string, personId: string, needsTransport: boolean, needsMeal: boolean, schoolId: string, classId: string) {
    let student = await prisma.student.findFirst({ where: { studentCode } });
    if (!student) {
      student = await prisma.student.create({
        data: {
          studentCode,
          personId,
          usesSchoolTransport: needsTransport,
          needsSpecialMeal: needsMeal
        }
      });
      // Matricular
      await prisma.enrollment.create({
        data: { year: 2026, studentId: student.id, schoolId, classId }
      });
    }
    return student;
  }

  await ensureStudent('MAT2026001', pStudent1.id, true, false, school1.id, class1.id);
  await ensureStudent('MAT2026002', pStudent2.id, false, true, school1.id, class1.id);
  await ensureStudent('MAT2026003', pStudent3.id, true, true, school2.id, class2.id);

  console.log('✅ 3 Alunos criados e matriculados.');

  // 5. Diário de Classe
  let subject = await prisma.schoolSubject.findFirst({ where: { name: 'Português' } });
  if (!subject) {
    subject = await prisma.schoolSubject.create({ data: { name: 'Português', code: 'PORT' } });
  }

  const classDiary = await prisma.classDiary.findFirst({ where: { classId: class1.id } });
  if (!classDiary) {
    await prisma.classDiary.create({
      data: {
        date: new Date(),
        contentTaught: 'Alfabetização Inicial - Vogais',
        status: 'Aberto',
        classId: class1.id,
        teacherId: teacher.id,
        subjectId: subject.id
      }
    });
  }

  // 6. Merenda Escolar
  await prisma.schoolMeal.create({
    data: {
      date: new Date(),
      menu: 'Arroz, feijão, frango desfiado e salada de repolho',
      servedQuantity: 450,
      schoolId: school1.id,
      warehouseId: warehouse.id,
      notes: 'Refeição principal servida no turno da manhã'
    }
  });

  await prisma.schoolMeal.create({
    data: {
      date: new Date(),
      menu: 'Sopa de legumes com carne',
      servedQuantity: 180,
      schoolId: school2.id,
      warehouseId: warehouse.id
    }
  });

  console.log('✅ Diário e Merendas registradas.');
  console.log('\n🎉 Seed do Módulo 12 concluído!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
