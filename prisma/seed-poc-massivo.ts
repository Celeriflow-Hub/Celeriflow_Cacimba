import "dotenv/config";
import type { HealthProfessional } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import fs from "node:fs";
import path from "node:path";
import {
  pocFixture,
  pocFixtureUsers,
  syntheticAddress,
  syntheticCnpj,
  syntheticCpf,
  syntheticCulturalProjectName,
  syntheticMaterialName,
  syntheticPersonEmail,
  syntheticPersonName,
  syntheticPhone,
  syntheticProcurementObject,
  syntheticSupplier,
  syntheticWorkName,
} from "../src/lib/poc/fixture-catalog";

function ensureSampleFiles() {
  const docsDir = path.join(process.cwd(), "public", "docs");
  const uploadsDir = path.join(process.cwd(), "public", "uploads");

  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const pdfContent = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF\n";
  const pdfBuffer = Buffer.from(pdfContent);
  const docxBuffer = Buffer.from("PK\x03\x04Documento de Exemplo CeleriFlow POC Massivo 2026");

  const files = [
    [path.join(docsDir, "sample.pdf"), pdfBuffer],
    [path.join(docsDir, "sample.docx"), docxBuffer],
    [path.join(uploadsDir, "sample.pdf"), pdfBuffer],
  ] as [string, Buffer][];

  for (const [filePath, buffer] of files) {
    fs.writeFileSync(filePath, buffer);
  }
}

function legacyEmployeeCpf(index: number) {
  const part1 = (100 + (index % 800)).toString().padStart(3, "0");
  const part2 = (200 + (index % 700)).toString().padStart(3, "0");
  const part3 = (300 + (index % 600)).toString().padStart(3, "0");
  const digit = ((index * 7) % 89 + 10).toString();
  return `${part1}.${part2}.${part3}-${digit}`;
}

export async function runMassivePocSeed() {
  console.log("🚀 Iniciando Seed Massiva da POC CeleriFlow (500 Servidores, 500 Pessoas Físicas, 200+ por módulo)...");
  ensureSampleFiles();

  // 1. Exercício Fiscal e Secretarias
  await prisma.financialYear.upsert({
    where: { year: 2026 },
    create: {
      year: 2026,
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      endDate: new Date("2026-12-31T23:59:59.999Z"),
      status: "Aberto",
    },
    update: { status: "Aberto" },
  });

  const secFinancas = await prisma.secretariat.upsert({
    where: { id: "sec-fin-01" },
    create: { id: "sec-fin-01", name: "Secretaria de Finanças e Planejamento", acronym: "SEFIN" },
    update: { name: "Secretaria de Finanças e Planejamento" },
  });

  const secEducacao = await prisma.secretariat.upsert({
    where: { id: "sec-edu-01" },
    create: { id: "sec-edu-01", name: "Secretaria de Educação e Cultura", acronym: "SEDUC" },
    update: { name: "Secretaria de Educação e Cultura" },
  });

  const secSaude = await prisma.secretariat.upsert({
    where: { id: "sec-sau-01" },
    create: { id: "sec-sau-01", name: "Secretaria de Saúde", acronym: "SMS" },
    update: { name: "Secretaria de Saúde" },
  });

  const secSocial = await prisma.secretariat.upsert({
    where: { id: "sec-soc-01" },
    create: { id: "sec-soc-01", name: "Secretaria de Assistência Social", acronym: "SEMAS" },
    update: { name: "Secretaria de Assistência Social" },
  });

  const deptCompras = await prisma.department.upsert({
    where: { id: "dept-compras-01" },
    create: { id: "dept-compras-01", name: "Departamento de Compras e Licitações", secretariatId: secFinancas.id },
    update: { name: "Departamento de Compras e Licitações" },
  });
  const [deptEducacao, deptSaude, deptSocial] = await Promise.all([
    prisma.department.upsert({ where: { id: "dept-educacao-01" }, create: { id: "dept-educacao-01", name: "Departamento de Gestão Escolar", secretariatId: secEducacao.id }, update: { name: "Departamento de Gestão Escolar", secretariatId: secEducacao.id } }),
    prisma.department.upsert({ where: { id: "dept-saude-01" }, create: { id: "dept-saude-01", name: "Departamento de Atenção Primária", secretariatId: secSaude.id }, update: { name: "Departamento de Atenção Primária", secretariatId: secSaude.id } }),
    prisma.department.upsert({ where: { id: "dept-social-01" }, create: { id: "dept-social-01", name: "Departamento de Proteção Social Básica", secretariatId: secSocial.id }, update: { name: "Departamento de Proteção Social Básica", secretariatId: secSocial.id } }),
  ]);

  await prisma.budgetUnit.upsert({
    where: { code: "0101" },
    create: { code: "0101", name: pocFixture.cityHallName, secretariatId: secFinancas.id },
    update: { name: pocFixture.cityHallName },
  });

  await prisma.budgetUnit.upsert({
    where: { code: "0201" },
    create: { code: "0201", name: pocFixture.chamberName, secretariatId: secFinancas.id },
    update: { name: pocFixture.chamberName },
  });

  // 2. Perfis e Usuários
  const perfilAdmin = await prisma.configuracaoPerfil.upsert({
    where: { codigo: "SYSTEM_ADMINISTRATOR" },
    create: { id: "perfil-admin-poc", codigo: "SYSTEM_ADMINISTRATOR", nome: "Administrador Geral", ativo: true, permissoes: '{"acesso":"operacional","modules":{}}' },
    update: { codigo: "SYSTEM_ADMINISTRATOR", nome: "Administrador Geral", ativo: true, permissoes: '{"acesso":"operacional","modules":{}}' },
  });

  const existingAdmin = await prisma.usuario.findUnique({ where: { email: pocFixtureUsers.admin.email } })
    ?? await prisma.usuario.findUnique({ where: { email: pocFixtureUsers.admin.legacyEmail } });
  if (existingAdmin) {
    await prisma.usuario.update({
      where: { id: existingAdmin.id },
      data: { email: pocFixtureUsers.admin.email, nome: pocFixtureUsers.admin.name, perfilId: perfilAdmin.id, ativo: true },
    });
  } else {
    await prisma.usuario.create({
      data: { email: pocFixtureUsers.admin.email, nome: pocFixtureUsers.admin.name, perfilId: perfilAdmin.id, ativo: true },
    });
  }

  // 3. SEED MASSIVO: CADASTRO DE SERVIDORES (500 SERVIDORES)
  console.log("   --> Gerando 500 Servidores no RH...");
  const secretariasList = [secFinancas.id, secEducacao.id, secSaude.id, secSocial.id];
  const departmentsList = [deptCompras.id, deptEducacao.id, deptSaude.id, deptSocial.id];
  for (let i = 1; i <= 500; i++) {
    const numStr = i.toString().padStart(4, "0");
    const cpfSimulado = syntheticCpf(i);
    const secId = secretariasList[i % secretariasList.length];
    const departmentId = departmentsList[i % departmentsList.length];
    const employee = await prisma.employee.findFirst({
      where: { OR: [{ cpf: cpfSimulado }, { cpf: legacyEmployeeCpf(i) }, { registration: `MAT-2026-${numStr}` }, { registration: `AV-2026-${numStr}` }] },
      select: { id: true },
    });
    const data = {
      name: syntheticPersonName(i),
      cpf: cpfSimulado,
      registration: `AV-2026-${numStr}`,
      email: `servidor.${numStr}@${pocFixture.emailDomain}`,
      phone: syntheticPhone(i),
      secretariatId: secId,
      departmentId,
      isActive: i % 19 !== 0,
    };
    if (employee) await prisma.employee.update({ where: { id: employee.id }, data });
    else await prisma.employee.create({ data });
  }
  console.log("   ✅ 500 Servidores criados com sucesso.");

  // 4. SEED MASSIVO: PESSOAS FÍSICAS (500 PESSOAS) E JURÍDICAS (200 EMPRESAS)
  console.log("   --> Gerando 500 Pessoas Físicas e 200 Pessoas Jurídicas / Fornecedores...");
  for (let i = 1; i <= 500; i++) {
    const numStr = i.toString().padStart(4, "0");
    const cpfPessoa = syntheticCpf(1000 + i);

    // Pessoa Física
    await prisma.person.upsert({
      where: { id: `person-teste-${numStr}` },
      create: {
        id: `person-teste-${numStr}`,
        fullName: syntheticPersonName(1000 + i),
        cpf: cpfPessoa,
        email: syntheticPersonEmail(i),
        phonePrimary: syntheticPhone(1000 + i),
        nationality: "Brasileira",
        profession: i % 4 === 0 ? "Autônomo" : i % 4 === 1 ? "Comerciante" : i % 4 === 2 ? "Agricultor familiar" : "Prestador de serviços",
      },
      update: {
        fullName: syntheticPersonName(1000 + i),
        cpf: cpfPessoa,
        email: syntheticPersonEmail(i),
        phonePrimary: syntheticPhone(1000 + i),
        nationality: "Brasileira",
        profession: i % 4 === 0 ? "Autônomo" : i % 4 === 1 ? "Comerciante" : i % 4 === 2 ? "Agricultor familiar" : "Prestador de serviços",
      },
    });
  }

  for (let i = 1; i <= 200; i++) {
    const numStr = i.toString().padStart(4, "0");
    const cnpjEmpresa = syntheticCnpj(i);
    const supplierData = syntheticSupplier(i);

    // Pessoa Jurídica
    const empresa = await prisma.company.upsert({
      where: { id: `company-teste-${numStr}` },
      create: {
        id: `company-teste-${numStr}`,
        cnpj: cnpjEmpresa,
        corporateName: supplierData.corporateName,
        tradeName: supplierData.tradeName,
        emailPrimary: supplierData.email,
        companyType: "LTDA",
        taxRegime: i % 3 === 0 ? "Simples Nacional" : "Lucro Presumido",
        primaryCnae: "47.89-0-99",
      },
      update: {
        cnpj: cnpjEmpresa,
        corporateName: supplierData.corporateName,
        tradeName: supplierData.tradeName,
        emailPrimary: supplierData.email,
        companyType: "LTDA",
        taxRegime: i % 3 === 0 ? "Simples Nacional" : "Lucro Presumido",
        primaryCnae: "47.89-0-99",
      },
    });

    // Fornecedor
    const supp = await prisma.supplier.upsert({
      where: { id: `supp-poc-${numStr}` },
      create: { id: `supp-poc-${numStr}`, companyId: empresa.id, category: supplierData.segment, businessBranch: supplierData.segment, status: i % 11 === 0 ? "Inativo" : "Ativo" },
      update: { companyId: empresa.id, category: supplierData.segment, businessBranch: supplierData.segment, status: i % 11 === 0 ? "Inativo" : "Ativo" },
    });

    // Credor
    await prisma.creditor.upsert({
      where: { supplierId: supp.id },
      create: { supplierId: supp.id, name: supplierData.corporateName, document: cnpjEmpresa, companyId: empresa.id },
      update: { name: supplierData.corporateName, document: cnpjEmpresa, companyId: empresa.id },
    });
  }
  console.log("   ✅ 500 Pessoas Físicas e 200 Pessoas Jurídicas / Credores criados.");

  // 5. SEED MASSIVO: PROCESSO LICITATÓRIO & CONTRATOS (200 CONTRATOS E LICITAÇÕES)
  console.log("   --> Gerando 200 Licitações e Contratos...");
  const firstSupplier = await prisma.supplier.findUnique({ where: { id: "supp-poc-0001" } });
  const statusesContrato = ["Vigente", "Em Análise", "Encerrado", "Aditado", "Suspenso"];

  for (let i = 1; i <= 200; i++) {
    const numStr = i.toString().padStart(4, "0");
    const statusAtual = statusesContrato[i % statusesContrato.length];
    const object = syntheticProcurementObject(i);
    const estimatedValue = 48500 + i * 2875;

    const proc = await prisma.purchaseProcess.upsert({
      where: { id: `proc-licita-massivo-${numStr}` },
      create: {
        id: `proc-licita-massivo-${numStr}`,
        number: `LICITA-2026/${numStr}`,
        object,
        type: i % 2 === 0 ? "Registro de Preços" : "Menor Preço",
        modality: i % 3 === 0 ? "Pregão Eletrônico" : "Concorrência Pública",
        estimatedValue,
        status: statusAtual === "Vigente" ? "Homologado" : "Em Andamento",
        secretariatId: secFinancas.id,
      },
      update: {
        object,
        type: i % 2 === 0 ? "Registro de Preços" : "Menor Preço",
        modality: i % 3 === 0 ? "Pregão Eletrônico" : "Concorrência Pública",
        estimatedValue,
        status: statusAtual === "Vigente" ? "Homologado" : "Em Andamento",
        secretariatId: secFinancas.id,
      },
    });

    if (firstSupplier) {
      await prisma.contract.upsert({
        where: { number: `CONT-2026/${numStr}` },
        create: {
          number: `CONT-2026/${numStr}`,
          object: `Contrato administrativo para ${object}`,
          initialValue: estimatedValue,
          updatedValue: estimatedValue,
          startDate: new Date("2026-01-01T00:00:00.000Z"),
          endDate: new Date("2026-12-31T23:59:59.999Z"),
          status: statusAtual,
          supplier: { connect: { id: firstSupplier.id } },
          process: { connect: { id: proc.id } },
          secretariat: { connect: { id: secFinancas.id } },
        },
        update: { object: `Contrato administrativo para ${object}`, initialValue: estimatedValue, updatedValue: estimatedValue, status: statusAtual },
      });
    }
  }
  console.log("   ✅ 200 Licitações e 200 Contratos criados.");

  // 6. SEED MASSIVO: PATRIMÔNIO (200 BENS PATRIMONIAIS)
  console.log("   --> Gerando 200 Bens Patrimoniais...");
  const almox = await prisma.warehouse.upsert({
    where: { id: "almox-central" },
    create: { id: "almox-central", name: "Almoxarifado Central de Aurora das Veredas", address: syntheticAddress(701) },
    update: { name: "Almoxarifado Central de Aurora das Veredas", address: syntheticAddress(701) },
  });

  const catMat = await prisma.materialCategory.upsert({
    where: { code: "CAT-PATRIMONIO-POC" },
    create: { code: "CAT-PATRIMONIO-POC", name: "Equipamentos e mobiliário administrativo" },
    update: { name: "Equipamentos e mobiliário administrativo" },
  });

  for (let i = 1; i <= 200; i++) {
    const numStr = i.toString().padStart(4, "0");
    const mat = await prisma.material.upsert({
      where: { code: `PAT-MAT-${numStr}` },
      create: { code: `PAT-MAT-${numStr}`, name: syntheticMaterialName(i), unitOfMeasure: "UN", categoryId: catMat.id },
      update: { name: syntheticMaterialName(i), unitOfMeasure: "UN", categoryId: catMat.id },
    });

    await prisma.materialStock.upsert({
      where: { id: `stock-pat-${numStr}` },
      create: { id: `stock-pat-${numStr}`, warehouseId: almox.id, materialId: mat.id, quantity: 10 + i },
      update: { quantity: 10 + i },
    });
  }
  console.log("   ✅ 200 Bens Patrimoniais/Materiais criados.");

  // 7. SEED MASSIVO: EDUCAÇÃO (200 ALUNOS E MATRÍCULAS)
  console.log("   --> Gerando 200 Alunos e Matrículas na Educação...");
  const escola = await prisma.school.upsert({
    where: { inepCode: "25000001" },
    create: { inepCode: "25000001", name: "Escola Municipal Caminhos do Saber", capacity: 1000, isActive: true },
    update: { name: "Escola Municipal Caminhos do Saber", capacity: 1000, isActive: true },
  });

  const turmas = await Promise.all([
    prisma.schoolClass.upsert({ where: { id: "turma-5ano-a" }, create: { id: "turma-5ano-a", name: "5º Ano A", schoolId: escola.id, year: 2026, stage: "Ensino Fundamental", grade: "5º Ano", shift: "Manhã" }, update: { name: "5º Ano A", schoolId: escola.id, year: 2026, stage: "Ensino Fundamental", grade: "5º Ano", shift: "Manhã" } }),
    prisma.schoolClass.upsert({ where: { id: "turma-5ano-b" }, create: { id: "turma-5ano-b", name: "5º Ano B", schoolId: escola.id, year: 2026, stage: "Ensino Fundamental", grade: "5º Ano", shift: "Tarde" }, update: { name: "5º Ano B", schoolId: escola.id, year: 2026, stage: "Ensino Fundamental", grade: "5º Ano", shift: "Tarde" } }),
    prisma.schoolClass.upsert({ where: { id: "turma-6ano-a" }, create: { id: "turma-6ano-a", name: "6º Ano A", schoolId: escola.id, year: 2026, stage: "Ensino Fundamental", grade: "6º Ano", shift: "Manhã" }, update: { name: "6º Ano A", schoolId: escola.id, year: 2026, stage: "Ensino Fundamental", grade: "6º Ano", shift: "Manhã" } }),
    prisma.schoolClass.upsert({ where: { id: "turma-6ano-b" }, create: { id: "turma-6ano-b", name: "6º Ano B", schoolId: escola.id, year: 2026, stage: "Ensino Fundamental", grade: "6º Ano", shift: "Tarde" }, update: { name: "6º Ano B", schoolId: escola.id, year: 2026, stage: "Ensino Fundamental", grade: "6º Ano", shift: "Tarde" } }),
  ]);

  for (let i = 1; i <= 200; i++) {
    const numStr = i.toString().padStart(4, "0");
    const pf = await prisma.person.findUnique({ where: { id: `person-teste-${numStr}` } });
    if (pf) {
      const student = await prisma.student.upsert({
        where: { studentCode: `ALU-2026-${numStr}` },
        create: { studentCode: `ALU-2026-${numStr}`, personId: pf.id },
        update: {},
      });

      await prisma.enrollment.upsert({
        where: { id: `enrollment-aluno-${numStr}` },
        create: { id: `enrollment-aluno-${numStr}`, studentId: student.id, schoolId: escola.id, classId: turmas[i % turmas.length].id, year: 2026, status: i % 17 === 0 ? "Transferido" : "Matriculado" },
        update: { schoolId: escola.id, classId: turmas[i % turmas.length].id, year: 2026, status: i % 17 === 0 ? "Transferido" : "Matriculado" },
      });
    }
  }
  console.log("   ✅ 200 Alunos e Matrículas criadas.");

  // 8. SEED MASSIVO: SAÚDE (200 PACIENTES E ATENDIMENTOS)
  console.log("   --> Gerando 200 Pacientes e Consultas de Saúde...");
  const ubs = await prisma.healthUnit.upsert({
    where: { cnes: "CNES-001" },
    create: { cnes: "CNES-001", name: "UBS Doutora Lúcia Ribeiro - Centro", type: "UBS" },
    update: { name: "UBS Doutora Lúcia Ribeiro - Centro", type: "UBS" },
  });

  const firstServidor = await prisma.employee.findUnique({ where: { cpf: syntheticCpf(1) } });
  let profSaude: HealthProfessional | null = null;
  if (firstServidor) {
    profSaude = await prisma.healthProfessional.upsert({
      where: { employeeId: firstServidor.id },
      create: { employeeId: firstServidor.id, councilName: "CRM", councilNumber: "CRM-MG 18999", specialty: "Clínica de família e comunidade", isActive: true },
      update: { councilName: "CRM", councilNumber: "CRM-MG 18999", specialty: "Clínica de família e comunidade", isActive: true },
    });
  }

  for (let i = 1; i <= 200; i++) {
    const numStr = i.toString().padStart(4, "0");
    const pf = await prisma.person.findUnique({ where: { id: `person-teste-${numStr}` } });
    if (pf) {
      const patient = await prisma.patient.upsert({
        where: { cns: `700000000000${numStr}` },
        create: { cns: `700000000000${numStr}`, personId: pf.id },
        update: {},
      });

      const dayStr = ((i % 28) + 1).toString().padStart(2, "0");
      if (profSaude) {
        await prisma.healthAppointment.upsert({
          where: { id: `consulta-massiva-${numStr}` },
          create: {
            id: `consulta-massiva-${numStr}`,
            patientId: patient.id,
            unitId: ubs.id,
            professionalId: profSaude.id,
            date: new Date(`2026-02-${dayStr}T${i % 2 === 0 ? "08:30" : "14:00"}:00.000Z`),
            status: i % 9 === 0 ? "Cancelado" : "Atendido",
            specialty: "Clínica de família e comunidade",
          },
          update: { date: new Date(`2026-02-${dayStr}T${i % 2 === 0 ? "08:30" : "14:00"}:00.000Z`), status: i % 9 === 0 ? "Cancelado" : "Atendido", specialty: "Clínica de família e comunidade" },
        });
      }
    }
  }
  console.log("   ✅ 200 Pacientes e Agendamentos de Saúde criados.");

  // 9. SEED MASSIVO: ASSISTÊNCIA SOCIAL (200 FAMÍLIAS E ATENDIMENTOS)
  console.log("   --> Gerando 200 Famílias no CRAS...");
  const cras = await prisma.socialUnit.upsert({
    where: { id: "cras-centro-01" },
    create: { id: "cras-centro-01", name: "CRAS Jardim das Acácias", type: "CRAS", isActive: true },
    update: { name: "CRAS Jardim das Acácias", type: "CRAS", isActive: true },
  });

  for (let i = 1; i <= 200; i++) {
    const numStr = i.toString().padStart(4, "0");
    const pf = await prisma.person.findUnique({ where: { id: `person-teste-${numStr}` } });
    if (pf) {
      const fam = await prisma.socialFamily.upsert({
        where: { representativeId: pf.id },
        create: { familyCode: `AV-FAM-2026-${numStr}`, nis: `214${numStr}09`, representativeId: pf.id, income: 1518 + (i % 6) * 185, status: "Ativo" },
        update: { familyCode: `AV-FAM-2026-${numStr}`, nis: `214${numStr}09`, income: 1518 + (i % 6) * 185, status: "Ativo" },
      });

      if (firstServidor) {
        await prisma.socialAttendance.upsert({
          where: { id: `atend-soc-massivo-${numStr}` },
          create: {
            id: `atend-soc-massivo-${numStr}`,
            family: { connect: { id: fam.id } },
            unit: { connect: { id: cras.id } },
            professional: { connect: { id: firstServidor.id } },
            date: new Date(`2026-01-${String((i % 26) + 1).padStart(2, "0")}T14:00:00.000Z`),
            type: i % 3 === 0 ? "Atualização cadastral" : "Acompanhamento Familiar PAIF",
            description: `Atendimento de acompanhamento familiar e orientação sobre serviços socioassistenciais para ${syntheticPersonName(1000 + i)}.`,
          },
          update: {
            date: new Date(`2026-01-${String((i % 26) + 1).padStart(2, "0")}T14:00:00.000Z`),
            type: i % 3 === 0 ? "Atualização cadastral" : "Acompanhamento Familiar PAIF",
            description: `Atendimento de acompanhamento familiar e orientação sobre serviços socioassistenciais para ${syntheticPersonName(1000 + i)}.`,
          },
        });
      }
    }
  }
  console.log("   ✅ 200 Famílias e Atendimentos Sociais criados.");

  // 10. SEED MASSIVO: MEIO AMBIENTE (200 LICENÇAS AMBIENTAIS)
  console.log("   --> Gerando 200 Licenças Ambientais...");
  const empEnv = await prisma.envEnterprise.upsert({
    where: { id: "emp-env-geral" },
    create: { id: "emp-env-geral", name: "Empreendimentos Produtivos de Aurora das Veredas", activityType: "Comércio, serviços e beneficiamento agrícola", status: "Ativo" },
    update: { name: "Empreendimentos Produtivos de Aurora das Veredas", activityType: "Comércio, serviços e beneficiamento agrícola", status: "Ativo" },
  });

  const tiposLicenca = ["Licença Prévia (LP)", "Licença de Instalação (LI)", "Licença de Operação (LO)", "Licença Simplificada (LS)"];

  for (let i = 1; i <= 200; i++) {
    const numStr = i.toString().padStart(4, "0");
    await prisma.envLicense.upsert({
      where: { licenseNumber: `LIC-ENV-2026/${numStr}` },
      create: {
        licenseNumber: `LIC-ENV-2026/${numStr}`,
        enterpriseId: empEnv.id,
        licenseType: tiposLicenca[i % tiposLicenca.length],
        issueDate: new Date(`2026-01-${String((i % 25) + 1).padStart(2, "0")}T00:00:00.000Z`),
        validUntil: new Date(`2027-01-${String((i % 25) + 1).padStart(2, "0")}T00:00:00.000Z`),
        status: i % 7 === 0 ? "Em Análise" : "Emitida",
      },
      update: { licenseType: tiposLicenca[i % tiposLicenca.length], issueDate: new Date(`2026-01-${String((i % 25) + 1).padStart(2, "0")}T00:00:00.000Z`), validUntil: new Date(`2027-01-${String((i % 25) + 1).padStart(2, "0")}T00:00:00.000Z`), status: i % 7 === 0 ? "Em Análise" : "Emitida" },
    });
  }
  console.log("   ✅ 200 Licenças Ambientais criadas.");

  // 11. SEED MASSIVO: OBRAS PÚBLICAS (200 OBRAS)
  console.log("   --> Gerando 200 Obras Públicas...");
  const statusObras = ["Planejada", "Em Execução", "Vistoriada", "Concluída", "Paralisada"];
  for (let i = 1; i <= 200; i++) {
    const numStr = i.toString().padStart(4, "0");
    await prisma.obrasObra.upsert({
      where: { numero: `OBRA-2026/${numStr}` },
      create: {
        id: `obra-massiva-${numStr}`,
        numero: `OBRA-2026/${numStr}`,
        nome: syntheticWorkName(i),
        local: syntheticAddress(2000 + i),
        tipo: i % 2 === 0 ? "Pavimentação" : "Construção de Equipamento Público",
        valorEstimado: 185000 + i * 18750,
        status: statusObras[i % statusObras.length],
      },
      update: { nome: syntheticWorkName(i), local: syntheticAddress(2000 + i), tipo: i % 2 === 0 ? "Pavimentação" : "Construção de Equipamento Público", valorEstimado: 185000 + i * 18750, status: statusObras[i % statusObras.length] },
    });
  }
  console.log("   ✅ 200 Obras Públicas criadas.");

  // 12. SEED MASSIVO: CULTURA & TURISMO (200 PROJETOS CULTURAIS)
  console.log("   --> Gerando 200 Projetos Culturais...");
  const pf1 = await prisma.person.findUnique({ where: { id: "person-teste-0001" } });
  if (pf1) {
    const agente = await prisma.culturaAgente.upsert({
      where: { id: "agente-cult-massivo" },
      create: { id: "agente-cult-massivo", nome: "Instituto Cultural Veredas Vivas", personId: pf1.id, tipo: "Coletivo Cultural", segmento: "Cultura popular e formação artística" },
      update: { nome: "Instituto Cultural Veredas Vivas", tipo: "Coletivo Cultural", segmento: "Cultura popular e formação artística" },
    });

    for (let i = 1; i <= 200; i++) {
      const numStr = i.toString().padStart(4, "0");
      await prisma.culturaProjeto.upsert({
        where: { numero: `PROJ-CULT-2026/${numStr}` },
        create: {
          id: `proj-cult-massivo-${numStr}`,
          numero: `PROJ-CULT-2026/${numStr}`,
          nome: syntheticCulturalProjectName(i),
          categoria: i % 2 === 0 ? "Música e Literatura" : "Teatro e Artesanato",
          agenteId: agente.id,
          valorSolicitado: 8500 + i * 625,
          status: i % 4 === 0 ? "Em Avaliação" : "Aprovado",
        },
        update: { nome: syntheticCulturalProjectName(i), categoria: i % 2 === 0 ? "Música e Literatura" : "Teatro e Artesanato", valorSolicitado: 8500 + i * 625, status: i % 4 === 0 ? "Em Avaliação" : "Aprovado" },
      });
    }
  }
  console.log("   ✅ 200 Projetos Culturais criados.");

  // 13. SEED MASSIVO: SEGURANÇA PÚBLICA (200 OCORRÊNCIAS)
  console.log("   --> Gerando 200 Ocorrências da Guarda Municipal...");
  const guarda = await prisma.segurancaGuarda.upsert({
    where: { matricula: "GCM-001" },
    create: { matricula: "GCM-001", nome: "Inspetora Renata Silva", tipo: "Guarda Municipal", status: "Ativo", isActive: true },
    update: { nome: "Inspetora Renata Silva", tipo: "Guarda Municipal", status: "Ativo", isActive: true },
  });

  for (let i = 1; i <= 200; i++) {
    const numStr = i.toString().padStart(4, "0");
    await prisma.segurancaOcorrencia.upsert({
      where: { numero: `GCM-2026/${numStr}` },
      create: {
        numero: `GCM-2026/${numStr}`,
        responsavelGuardaId: guarda.id,
        tipo: i % 2 === 0 ? "Ronda escolar preventiva" : "Vistoria de patrimônio público",
        descricao: `Registro de atendimento preventivo em área pública de ${pocFixture.municipalityName}, protocolo operacional ${numStr}.`,
        status: i % 8 === 0 ? "Em Andamento" : "Encerrada",
      },
      update: { tipo: i % 2 === 0 ? "Ronda escolar preventiva" : "Vistoria de patrimônio público", descricao: `Registro de atendimento preventivo em área pública de ${pocFixture.municipalityName}, protocolo operacional ${numStr}.`, status: i % 8 === 0 ? "Em Andamento" : "Encerrada" },
    });
  }
  console.log("   ✅ 200 Ocorrências de Segurança criadas.");

  // 14. SEED MASSIVO: SANEAMENTO (200 UNIDADES CONSUMIDORAS & FATURAS)
  console.log("   --> Gerando 200 Unidades Consumidoras de Saneamento...");
  for (let i = 1; i <= 200; i++) {
    const numStr = i.toString().padStart(4, "0");
    const uc = await prisma.sanConsumerUnit.upsert({
      where: { code: `UC-00${numStr}` },
      create: {
        code: `UC-00${numStr}`,
        address: syntheticAddress(3000 + i),
        category: i % 3 === 0 ? "Comercial" : "Residencial",
        status: "Ativa",
        ownerName: syntheticPersonName(1000 + i),
        ownerDocument: syntheticCpf(1000 + i),
      },
      update: { address: syntheticAddress(3000 + i), category: i % 3 === 0 ? "Comercial" : "Residencial", ownerName: syntheticPersonName(1000 + i), ownerDocument: syntheticCpf(1000 + i), status: "Ativa" },
    });

    await prisma.sanInvoice.upsert({
      where: { invoiceNumber: `FAT-2026/${numStr}` },
      create: {
        invoiceNumber: `FAT-2026/${numStr}`,
        unitId: uc.id,
        competence: "01/2026",
        dueDate: new Date("2026-02-15T00:00:00.000Z"),
        totalAmount: 35.00 + i * 1.5,
        status: i % 4 === 0 ? "Pendente" : "Paga",
      },
      update: {},
    });
  }
  console.log("   ✅ 200 Unidades e Faturas de Saneamento criadas.");

  // 15. SEED MASSIVO: CÂMARA MUNICIPAL (200 PROPOSIÇÕES LEGISLATIVAS)
  console.log("   --> Gerando 200 Proposições Legislativas na Câmara...");
  const leg = await prisma.camLegislatura.upsert({
    where: { numero: 19 },
    create: { id: "leg-2025-2028", numero: 19, inicio: new Date("2025-01-01T00:00:00.000Z"), fim: new Date("2028-12-31T23:59:59.999Z"), status: "Ativa" },
    update: {},
  });

  if (pf1) {
    const vereador = await prisma.camVereador.upsert({
      where: { id: "ver-massivo-01" },
      create: { id: "ver-massivo-01", legislaturaId: leg.id, personId: pf1.id, nomeCompleto: "Rafael Monteiro", nomeParlamentar: "Rafael das Veredas", partido: "Partido Municipal Democrático" },
      update: { legislaturaId: leg.id, personId: pf1.id, nomeCompleto: "Rafael Monteiro", nomeParlamentar: "Rafael das Veredas", partido: "Partido Municipal Democrático" },
    });

    for (let i = 1; i <= 200; i++) {
      const numStr = i.toString().padStart(4, "0");
      await prisma.camProposicao.upsert({
        where: { numero: `PL-2026/${numStr}` },
        create: {
          autorId: vereador.id,
          tipo: i % 2 === 0 ? "Projeto de Lei Ordinária" : "Requerimento Legislativo",
          numero: `PL-2026/${numStr}`,
          ementa: `Dispõe sobre medida de interesse local para qualificação dos serviços públicos e desenvolvimento sustentável do Município de ${pocFixture.municipalityName}.`,
          status: i % 4 === 0 ? "Aprovado em Votação" : "Protocolada",
        },
        update: { autorId: vereador.id, tipo: i % 2 === 0 ? "Projeto de Lei Ordinária" : "Requerimento Legislativo", ementa: `Dispõe sobre medida de interesse local para qualificação dos serviços públicos e desenvolvimento sustentável do Município de ${pocFixture.municipalityName}.`, status: i % 4 === 0 ? "Aprovado em Votação" : "Protocolada" },
      });
    }
  }
  console.log("   ✅ 200 Proposições Legislativas criadas.");

  // 16. SEED MASSIVO: CONEXÕES E LOGS DE INTEGRAÇÃO (CONSOLE DE INTEGRAÇÕES TÉCNICAS)
  console.log("   --> Gerando Conexões e Logs para o Console Técnico de Integrações...");
  const integracoesMock = [
    { code: "TCE_INTEGRATION", name: "Transmissor Estadual de Prestação de Contas", cat: "Auditoria Externa", endpoint: `https://integracoes.${pocFixture.emailDomain}/tce` },
    { code: "RECEITA_FEDERAL", name: "Validador cadastral de documentos", cat: "Cadastro", endpoint: `https://integracoes.${pocFixture.emailDomain}/documentos` },
    { code: "BANCO_BRASIL_PIX", name: "Banco Simulado Aurora - pagamentos", cat: "Financeiro & Bancos", endpoint: `https://integracoes.${pocFixture.emailDomain}/pagamentos` },
    { code: "ESOCIAL_RH", name: "Transmissor de eventos trabalhistas", cat: "Gestão de Pessoas", endpoint: `https://integracoes.${pocFixture.emailDomain}/folha` },
    { code: "CADUNICO_SOCIAL", name: "Consulta socioassistencial simulada", cat: "Assistência Social", endpoint: `https://integracoes.${pocFixture.emailDomain}/social` },
  ];

  for (const item of integracoesMock) {
    const conn = await prisma.integrationConnection.upsert({
      where: { code: item.code },
      create: {
        code: item.code,
        name: item.name,
        category: item.cat,
        provider: "SIMULADOR_POC",
        environment: "MOCK",
        status: "ATIVA",
        baseUrl: item.endpoint,
        configuration: { endpoint: item.endpoint, version: "2.1.0", timeoutMs: 5000 },
        mockScenario: { simulateSuccessRate: 0.95, mockResponseCode: 200 },
      },
      update: { name: item.name, category: item.cat, provider: "SIMULADOR_POC", environment: "MOCK", status: "ATIVA", baseUrl: item.endpoint, configuration: { endpoint: item.endpoint, version: "2.1.0", timeoutMs: 5000 }, mockScenario: { simulateSuccessRate: 0.95, mockResponseCode: 200 } },
    });

    await prisma.integrationRun.create({
      data: {
        connectionId: conn.id,
        operation: "CRON_SYNC",
        environment: "MOCK",
        status: "SUCESSO",
        message: `Execução simulada concluída para ${item.name}.`,
        payload: { status: "OK", protocol: `MOCK-${item.code}-2026`, data: { status: "PROCESSADO", scenario: "POC_FICTICIA" } },
      },
    });

    await prisma.integrationRun.create({
      data: {
        connectionId: conn.id,
        operation: "REPROCESSAR_MANUAL",
        environment: "MOCK",
        status: "SUCESSO",
        message: "Reprocessamento simulado pelo painel administrativo da POC.",
        payload: { status: "SUCCESS", scenario: "POC_FICTICIA" },
      },
    });
  }
  console.log("   ✅ Conexões de Integração e Logs para o Console Técnico criados.");

  console.log("🎉 Seed Massiva da POC CeleriFlow concluída com sucesso em TODOS os módulos!");
}

if (require.main === module) {
  runMassivePocSeed()
    .catch((e) => {
      console.error("❌ Erro ao executar a Seed Massiva:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
