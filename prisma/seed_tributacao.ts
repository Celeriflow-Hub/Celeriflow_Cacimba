import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Seeding Modulo 7 (Tributação)...');

  // 1. Pessoas
  const p1 = await prisma.person.upsert({
    where: { cpf: '111.111.111-11' },
    update: {},
    create: {
      fullName: 'João Silva Tributação',
      cpf: '111.111.111-11',
      rg: 'MG-11.111.111',
      birthDate: new Date('1980-01-01'),
      emailSecondary: 'joao.tributacao@email.com',
      phonePrimary: '(31) 99999-1111'
    }
  });

  const p2 = await prisma.person.upsert({
    where: { cpf: '222.222.222-22' },
    update: {},
    create: {
      fullName: 'Maria Oliveira Tributação',
      cpf: '222.222.222-22',
      rg: 'MG-22.222.222',
      birthDate: new Date('1990-05-15'),
      emailSecondary: 'maria.tributacao@email.com',
      phonePrimary: '(31) 98888-2222'
    }
  });

  // 2. Empresas
  const c1 = await prisma.company.upsert({
    where: { cnpj: '11.111.111/0001-11' },
    update: {},
    create: {
      corporateName: 'Tech Solutions ME',
      cnpj: '11.111.111/0001-11',
      emailPrimary: 'contato@techsolutions.com',
      phone: '(31) 3333-1111'
    }
  });

  const c2 = await prisma.company.upsert({
    where: { cnpj: '22.222.222/0001-22' },
    update: {},
    create: {
      corporateName: 'Padaria Pão Quente Ltda',
      cnpj: '22.222.222/0001-22',
      emailPrimary: 'padaria@paoquente.com',
      phone: '(31) 3333-2222'
    }
  });

  // 3. Taxpayers
  const t1 = await prisma.taxpayer.upsert({
    where: { personId: p1.id },
    update: {},
    create: {
      taxpayerType: 'PF',
      personId: p1.id,
      municipalInsc: 'PF-001'
    }
  });

  const t2 = await prisma.taxpayer.upsert({
    where: { personId: p2.id },
    update: {},
    create: {
      taxpayerType: 'PF',
      personId: p2.id,
      municipalInsc: 'PF-002'
    }
  });

  const t3 = await prisma.taxpayer.upsert({
    where: { companyId: c1.id },
    update: {},
    create: {
      taxpayerType: 'PJ',
      companyId: c1.id,
      municipalInsc: 'PJ-001'
    }
  });

  const t4 = await prisma.taxpayer.upsert({
    where: { companyId: c2.id },
    update: {},
    create: {
      taxpayerType: 'PJ',
      companyId: c2.id,
      municipalInsc: 'PJ-002'
    }
  });

  // 4. Imóveis
  const re1 = await prisma.realEstate.upsert({
    where: { municipalInsc: 'IM-1001' },
    update: {},
    create: {
      taxpayerId: t1.id,
      municipalInsc: 'IM-1001',
      streetName: 'Rua das Flores',
      number: '123',
      landArea: 360.5,
      builtArea: 150.0,
      propertyUse: 'Residencial'
    }
  });

  await prisma.realEstate.upsert({
    where: { municipalInsc: 'IM-1002' },
    update: {},
    create: {
      taxpayerId: t3.id,
      municipalInsc: 'IM-1002',
      streetName: 'Av. Paulista',
      number: '1000',
      landArea: 1000.0,
      builtArea: 800.0,
      propertyUse: 'Comercial'
    }
  });

  // 5. Cadastro Econômico
  const ec1 = await prisma.economicRegistration.upsert({
    where: { municipalInsc: 'EC-5001' },
    update: {},
    create: {
      taxpayerId: t3.id,
      municipalInsc: 'EC-5001',
      primaryCnae: '6201-5/01',
      startDate: new Date('2020-01-10'),
      status: 'Ativo'
    }
  });

  const ec2 = await prisma.economicRegistration.upsert({
    where: { municipalInsc: 'EC-5002' },
    update: {},
    create: {
      taxpayerId: t4.id,
      municipalInsc: 'EC-5002',
      primaryCnae: '1071-6/00',
      startDate: new Date('2018-05-20'),
      status: 'Ativo'
    }
  });

  // 6. Alvarás (No unique key, delete first)
  await prisma.license.deleteMany({ where: { taxpayerId: { in: [t3.id, t4.id] } }});
  
  await prisma.license.create({
    data: {
      licenseType: 'Funcionamento',
      taxpayerId: t3.id,
      economicRegistrationId: ec1.id,
      issueDate: new Date('2026-01-15'),
      validUntil: new Date('2027-01-15'),
      status: 'Emitido'
    }
  });

  await prisma.license.create({
    data: {
      licenseType: 'Sanitária',
      taxpayerId: t4.id,
      economicRegistrationId: ec2.id,
      issueDate: new Date('2026-02-10'),
      validUntil: new Date('2027-02-10'),
      status: 'Emitido'
    }
  });

  // 7. Dívida Ativa
  await prisma.activeDebt.upsert({
    where: { cdaNumber: 'CDA-2025-1001' },
    update: {},
    create: {
      taxpayerId: t2.id,
      originDebtType: 'IPTU',
      year: 2024,
      originalValue: 1540.50,
      updatedValue: 1650.00,
      cdaNumber: 'CDA-2025-1001',
      status: 'Inscrita'
    }
  });

  await prisma.activeDebt.upsert({
    where: { cdaNumber: 'CDA-2024-5002' },
    update: {},
    create: {
      taxpayerId: t3.id,
      originDebtType: 'ISS',
      year: 2023,
      originalValue: 5200.00,
      updatedValue: 5600.00,
      cdaNumber: 'CDA-2024-5002',
      status: 'Parcelada'
    }
  });

  // 8. Tax and TaxAssessment and TaxGuide
  // Delete guides and assessments to recreate them safely
  const tIds = [t1.id, t2.id, t3.id, t4.id];
  await prisma.taxGuide.deleteMany({ where: { assessment: { taxpayerId: { in: tIds } } } });
  await prisma.taxAssessment.deleteMany({ where: { taxpayerId: { in: tIds } } });
  
  // Tax does not have unique constraint on name, but let's check by name first
  let taxIptu = await prisma.tax.findFirst({ where: { name: 'IPTU' } });
  if (!taxIptu) {
    taxIptu = await prisma.tax.create({ data: { name: 'IPTU', taxType: 'Imposto' } });
  }

  let taxIss = await prisma.tax.findFirst({ where: { name: 'ISS' } });
  if (!taxIss) {
    taxIss = await prisma.tax.create({ data: { name: 'ISS', taxType: 'Imposto' } });
  }

  const assess1 = await prisma.taxAssessment.create({
    data: {
      year: 2026,
      originalValue: 450.00,
      taxId: taxIptu.id,
      taxpayerId: t1.id,
      realEstateId: re1.id,
      status: 'Lançado'
    }
  });

  const assess2 = await prisma.taxAssessment.create({
    data: {
      year: 2026,
      originalValue: 1250.75,
      taxId: taxIss.id,
      taxpayerId: t4.id,
      economicRegistrationId: ec2.id,
      status: 'Pago'
    }
  });

  await prisma.taxGuide.create({
    data: {
      assessmentId: assess1.id,
      barcode: '111122223333444455556666',
      totalValue: 450.00,
      dueDate: new Date('2026-08-15'),
      status: 'Emitida'
    }
  });

  await prisma.taxGuide.create({
    data: {
      assessmentId: assess2.id,
      barcode: '999988887777666655554444',
      totalValue: 1250.75,
      dueDate: new Date('2026-07-05'),
      status: 'Paga'
    }
  });

  console.log('Seed Modulo 7 concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
