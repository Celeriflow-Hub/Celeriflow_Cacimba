import { prisma } from '../src/lib/prisma';
import 'dotenv/config';

async function main() {
  console.log('Seeding Modulo 2 - Cadastros...');

  // 1. Neighborhoods
  const centro = await prisma.neighborhood.create({
    data: { name: 'Centro', type: 'Bairro', city: 'São Paulo', state: 'SP' }
  });
  const pinheiros = await prisma.neighborhood.create({
    data: { name: 'Pinheiros', type: 'Bairro', city: 'São Paulo', state: 'SP' }
  });

  // 2. Persons
  const p1 = await prisma.person.create({
    data: { fullName: 'João Silva', cpf: '11122233344', email: 'joao@email.com' }
  });
  const p2 = await prisma.person.create({
    data: { fullName: 'Maria Oliveira', cpf: '55566677788', email: 'maria@email.com' }
  });
  await prisma.person.create({
    data: { fullName: 'Carlos Pereira', cpf: '99900011122', email: 'carlos@email.com' }
  });

  // 3. Companies
  const c1 = await prisma.company.create({
    data: { corporateName: 'Empresa Alpha Ltda', cnpj: '12345678000199', companyType: 'LTDA' }
  });
  const c2 = await prisma.company.create({
    data: { corporateName: 'Tech Solutions S.A.', cnpj: '98765432000111', companyType: 'SA' }
  });

  // 4. Taxpayers
  const t1 = await prisma.taxpayer.create({
    data: { taxpayerType: 'PF', municipalInsc: 'IM-1001', personId: p1.id }
  });
  const t2 = await prisma.taxpayer.create({
    data: { taxpayerType: 'PJ', municipalInsc: 'IM-1002', companyId: c1.id }
  });

  // 5. Suppliers
  await prisma.supplier.create({
    data: { category: 'Serviços de TI', personId: p2.id }
  });
  await prisma.supplier.create({
    data: { category: 'Fornecimento de Equipamentos', companyId: c2.id }
  });

  // 6. Addresses
  await prisma.address.create({
    data: { zipCode: '01000-000', streetName: 'Rua Direita', number: '100', neighborhoodId: centro.id, personId: p1.id }
  });
  await prisma.address.create({
    data: { zipCode: '05400-000', streetName: 'Av. Faria Lima', number: '2000', neighborhoodId: pinheiros.id, companyId: c1.id }
  });

  // 7. RealEstates
  await prisma.realEstate.create({
    data: { municipalInsc: 'IMO-5001', propertyType: 'Casa', streetName: 'Rua das Flores', number: '123', neighborhoodId: centro.id, taxpayerId: t1.id }
  });
  await prisma.realEstate.create({
    data: { municipalInsc: 'IMO-5002', propertyType: 'Prédio Comercial', streetName: 'Av. Paulista', number: '1000', neighborhoodId: centro.id, taxpayerId: t2.id }
  });

  // 8. Documents
  await prisma.document.create({
    data: { title: 'RG João', documentType: 'RG', fileUrl: 'https://exemplo.com/rg.pdf', personId: p1.id }
  });
  await prisma.document.create({
    data: { title: 'Contrato Social Alpha', documentType: 'Contrato', fileUrl: 'https://exemplo.com/contrato.pdf', companyId: c1.id }
  });

  console.log('Modulo 2 seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
