import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Iniciando inserção de dados de teste...');

  // --- Módulo 1: Administração Geral ---
  console.log('Populando Módulo 1 (Administração)...');
  
  // Institution
  await prisma.institution.create({
    data: {
      name: 'Prefeitura Municipal de Exemplo',
      cnpj: '12.345.678/0001-99',
      mayorName: 'Prefeito João da Silva',
      city: 'Exemplo',
      state: 'SP'
    }
  });

  // Secretariat
  const sec = await prisma.secretariat.create({
    data: {
      name: 'Secretaria de Educação',
      acronym: 'SME',
      managerName: 'Maria Silva'
    }
  });

  // Department
  const dep = await prisma.department.create({
    data: {
      name: 'Departamento de Ensino Fundamental',
      secretariatId: sec.id
    }
  });

  // Administrative Unit
  const unit = await prisma.administrativeUnit.create({
    data: {
      name: 'Escola Municipal Esperança',
      type: 'Escola',
      secretariatId: sec.id
    }
  });

  // Role
  const role = await prisma.role.create({
    data: {
      name: 'Professor Titular',
      level: 'Servidor'
    }
  });

  // Employee
  await prisma.employee.create({
    data: {
      name: 'Carlos Educador',
      cpf: '111.222.333-44',
      email: 'carlos@escola.gov.br',
      roleId: role.id,
      secretariatId: sec.id,
      departmentId: dep.id,
      unitId: unit.id
    }
  });

  // --- Módulo 2: Cadastros Gerais ---
  console.log('Populando Módulo 2 (Cadastros Gerais)...');

  // Person
  const person = await prisma.person.create({
    data: {
      fullName: 'Ana Cidadã Brasileira',
      cpf: '99988877766',
      email: 'ana@email.com',
      phonePrimary: '(11) 98888-7777',
      status: 'Ativo'
    }
  });

  // Company
  const company = await prisma.company.create({
    data: {
      corporateName: 'Tech Solutions LTDA',
      tradeName: 'Tech Info',
      cnpj: '99888777000166',
      emailPrimary: 'contato@techsolutions.com',
      status: 'Ativo'
    }
  });

  // Taxpayer (Contribuinte PF)
  await prisma.taxpayer.create({
    data: {
      taxpayerType: 'PF',
      municipalInsc: 'IM-12345',
      personId: person.id
    }
  });

  // Taxpayer (Contribuinte PJ)
  await prisma.taxpayer.create({
    data: {
      taxpayerType: 'PJ',
      municipalInsc: 'IM-98765',
      companyId: company.id
    }
  });

  console.log('Inserção de dados concluída com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
