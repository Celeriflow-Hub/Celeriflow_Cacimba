import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
dotenv.config();

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando seed de RH...');

  // 1. Pegar Secretaria, Departamento e Cargo existentes ou criar novos
  let role = await prisma.role.findFirst();
  if (!role) {
    role = await prisma.role.create({
      data: { name: 'Analista de RH', description: 'Analista', level: 'Servidor' }
    });
  }

  let sec = await prisma.secretariat.findFirst();
  if (!sec) {
    sec = await prisma.secretariat.create({
      data: { name: 'Secretaria de Administração', acronym: 'SEC-ADM' }
    });
  }

  let dept = await prisma.department.findFirst();
  if (!dept) {
    dept = await prisma.department.create({
      data: { name: 'Recursos Humanos', description: 'Departamento de RH', secretariatId: sec.id }
    });
  }

  // 2. Limpar dados anteriores de RH se necessário, ou usar upsert/findFirst.
  // Como é um ambiente de desenvolvimento/teste, vamos verificar se o CPF existe
  let emp1 = await prisma.employee.findUnique({ where: { cpf: '111.111.111-11' } });
  if (!emp1) {
    emp1 = await prisma.employee.create({
    data: {
      name: 'João Carlos Silva',
      cpf: '111.111.111-11',
      registration: 'MAT-001',
      email: 'joao.silva@exemplo.com',
      phone: '(11) 99999-1111',
      isActive: true,
      roleId: role.id,
      departmentId: dept.id,
      secretariatId: sec.id
    }
  });
  }

  let emp2 = await prisma.employee.findUnique({ where: { cpf: '222.222.222-22' } });
  if (!emp2) {
    emp2 = await prisma.employee.create({
    data: {
      name: 'Maria Fernanda Souza',
      cpf: '222.222.222-22',
      registration: 'MAT-002',
      email: 'maria.souza@exemplo.com',
      phone: '(11) 99999-2222',
      isActive: true,
      roleId: role.id,
      departmentId: dept.id,
      secretariatId: sec.id
    }
  });
  }

  let emp3 = await prisma.employee.findUnique({ where: { cpf: '333.333.333-33' } });
  if (!emp3) {
    emp3 = await prisma.employee.create({
    data: {
      name: 'Pedro Henrique Oliveira',
      cpf: '333.333.333-33',
      registration: 'MAT-003',
      email: 'pedro.oliveira@exemplo.com',
      isActive: false, // Inativo para teste
      roleId: role.id,
      departmentId: dept.id,
      secretariatId: sec.id
    }
  });
  }

  console.log('Servidores criados.');

  // 3. Criar Folha de Pagamento
  await prisma.payroll.create({
    data: {
      competence: '06/2026',
      type: 'Mensal',
      status: 'Fechada',
      totalValue: 7000.00
    }
  });

  await prisma.payroll.create({
    data: {
      competence: '07/2026',
      type: 'Mensal',
      status: 'Aberta',
      totalValue: 7000.00
    }
  });
  console.log('Folhas criadas.');

  // 4. Férias
  await prisma.vacation.create({
    data: {
      employeeId: emp1.id,
      acquisitionStart: new Date('2024-01-01'),
      acquisitionEnd: new Date('2024-12-31'),
      enjoymentStart: new Date('2025-01-10'),
      enjoymentEnd: new Date('2025-02-08'),
      days: 30,
      status: 'Concluída'
    }
  });

  await prisma.vacation.create({
    data: {
      employeeId: emp2.id,
      acquisitionStart: new Date('2025-01-01'),
      acquisitionEnd: new Date('2025-12-31'),
      days: 30,
      status: 'Disponível'
    }
  });
  console.log('Férias criadas.');

  // 5. Ponto
  const today = new Date();
  await prisma.attendanceRecord.create({
    data: {
      employeeId: emp1.id,
      date: today,
      entryTime: new Date(today.setHours(8, 0, 0, 0)),
      exitTime: new Date(today.setHours(17, 0, 0, 0)),
      status: 'Presente',
      hoursWorked: 9
    }
  });
  console.log('Ponto criado.');

  // 6. Licença
  await prisma.leave.create({
    data: {
      employeeId: emp2.id,
      type: 'Médica',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-07-15'),
      reason: 'Atestado CID X01',
      status: 'Ativa'
    }
  });
  console.log('Licença criada.');

  // 7. Dependente
  await prisma.dependent.create({
    data: {
      employeeId: emp1.id,
      name: 'Lucas Silva',
      birthDate: new Date('2015-05-10'),
      relationship: 'Filho(a)'
    }
  });
  console.log('Dependente criado.');

  // 8. Benefício
  let benefitConfig = await prisma.benefitConfig.findFirst({ where: { name: 'Vale Transporte' }});
  if (!benefitConfig) {
    benefitConfig = await prisma.benefitConfig.create({
      data: {
        name: 'Vale Transporte',
        type: 'Vale Transporte',
        baseValue: 250.00
      }
    });
  }

  await prisma.payrollBenefit.create({
    data: {
      employeeId: emp1.id,
      benefitConfigId: benefitConfig.id,
      customValue: 250.00,
      status: 'Ativo'
    }
  });
  console.log('Benefício criado.');

  // 9. Ato de Pessoal
  await prisma.personnelAct.create({
    data: {
      employeeId: emp1.id,
      type: 'Nomeação',
      date: new Date('2020-01-15'),
      actNumber: 'PORT-101/2020'
    }
  });

  await prisma.personnelAct.create({
    data: {
      employeeId: emp3.id,
      type: 'Exoneração',
      date: new Date('2026-06-30'),
      actNumber: 'PORT-202/2026'
    }
  });
  console.log('Atos criados.');

  console.log('Seed de RH finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
