import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function seedMod6() {
  console.log("🚀 Iniciando seed do Módulo 6 (Portal e Transparência e integração com Mod 9)...");

  // 1. Criar Empresa para o Fornecedor (se não existir)
  let company = await prisma.company.findUnique({ where: { cnpj: "12345678000199" } });
  if (!company) {
    company = await prisma.company.create({
      data: {
        cnpj: "12345678000199",
        corporateName: "Construtora CeleriFlow S.A.",
        tradeName: "Celeri Construções",
        stateInsc: "123456",
        municipalInsc: "7890",
        openingDate: new Date("2010-01-01"),
        status: "Ativo"
      }
    });
    console.log("✅ Empresa Celeri Construções criada.");
  }

  // 2. Criar Fornecedor vinculado à empresa
  let supplier = await prisma.supplier.findUnique({ where: { companyId: company.id } });
  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: {
        companyId: company.id,
        category: "Construção Civil",
        businessBranch: "Engenharia",
        status: "Ativo"
      }
    });
    console.log("✅ Fornecedor criado.");
  }

  // Precisa de uma secretaria (já deve existir do seed_administracao, mas garantimos uma)
  let secEdu = await prisma.secretariat.findFirst({ where: { acronym: "SME" } });
  if (!secEdu) {
    secEdu = await prisma.secretariat.create({
      data: {
        name: "Secretaria Municipal de Educação",
        acronym: "SME",
        isActive: true
      }
    });
  }

  // 3. Criar Processo de Compra
  let purchaseProcess = await prisma.purchaseProcess.findUnique({ where: { number: "PRC-2026/001" } });
  if (!purchaseProcess) {
    purchaseProcess = await prisma.purchaseProcess.create({
      data: {
        number: "PRC-2026/001",
        object: "Reforma geral da Escola Municipal Infantil",
        type: "Obras",
        modality: "Concorrência",
        estimatedValue: 1500000.00,
        status: "Homologado",
        secretariatId: secEdu.id,
      }
    });
    console.log("✅ Processo de compra PRC-2026/001 criado.");
  }

  // 4. Criar Licitação (Bidding)
  let bidding = await prisma.bidding.findFirst({ where: { number: "CONC-001/2026" } });
  if (!bidding) {
    bidding = await prisma.bidding.create({
      data: {
        number: "CONC-001/2026",
        modality: "Concorrência Pública",
        status: "Concluída",
        publicationDate: new Date("2026-01-15"),
        sessionDate: new Date("2026-02-15"),
        processId: purchaseProcess.id,
      }
    });
    console.log("✅ Licitação CONC-001/2026 criada.");
  }

  // 5. Criar Contrato (Contract)
  let contract = await prisma.contract.findUnique({ where: { number: "CTR-045/2026" } });
  if (!contract) {
    contract = await prisma.contract.create({
      data: {
        number: "CTR-045/2026",
        object: "Execução das obras de reforma da Escola Municipal Infantil",
        initialValue: 1480000.00,
        updatedValue: 1480000.00,
        startDate: new Date("2026-03-01"),
        endDate: new Date("2026-12-31"),
        status: "Vigente",
        processId: purchaseProcess.id,
        supplierId: supplier.id,
        secretariatId: secEdu.id,
      }
    });
    console.log("✅ Contrato CTR-045/2026 criado.");
  }

  // 6. Criar PortalNews
  const news = await prisma.portalNews.findUnique({ where: { slug: "prefeitura-inicia-reforma" } });
  if (!news) {
    await prisma.portalNews.create({
      data: {
        title: "Prefeitura inicia reforma da Escola Infantil",
        subtitle: "Obras devem durar 10 meses e beneficiar mais de 500 alunos.",
        slug: "prefeitura-inicia-reforma",
        content: "A Prefeitura Municipal assinou hoje o contrato para a reforma geral da escola...",
        status: "Publicado",
        publishedAt: new Date(),
        secretariatId: secEdu.id
      }
    });
    console.log("✅ Notícia criada no Portal.");
  }

  // 7. Criar Diário Oficial
  const diary = await prisma.officialDiary.findUnique({ where: { editionNumber: 1542 } });
  if (!diary) {
    await prisma.officialDiary.create({
      data: {
        editionNumber: 1542,
        publishDate: new Date(),
        pdfUrl: "https://exemplo.com/diario-1542.pdf",
        status: "Publicado",
      }
    });
    console.log("✅ Edição do Diário Oficial criada.");
  }

  console.log("🎉 Seed do Módulo 6 concluído com sucesso!");
}

seedMod6()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
