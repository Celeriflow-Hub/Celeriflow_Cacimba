/**
 * Cenários persistidos para validação do módulo de Cultura, Esporte e Lazer.
 * Pode ser executado novamente sem duplicar os registros de referência.
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const secretariat = await prisma.secretariat.findFirst({ where: { name: "Secretaria de Cultura e Turismo" } })
    ?? await prisma.secretariat.create({ data: { name: "Secretaria de Cultura e Turismo", acronym: "SECULT" } });
  const department = await prisma.department.findFirst({ where: { name: "Departamento de Cultura e Eventos", secretariatId: secretariat.id } })
    ?? await prisma.department.create({ data: { name: "Departamento de Cultura e Eventos", secretariatId: secretariat.id } });
  const role = await prisma.role.findFirst({ where: { name: "Gestor Cultural" } })
    ?? await prisma.role.create({ data: { name: "Gestor Cultural", description: "Coordenação de políticas culturais e eventos." } });
  const coordinator = await prisma.employee.upsert({
    where: { cpf: "00022233344" },
    create: { name: "Helena Martins", cpf: "00022233344", registration: "CUL-1001", roleId: role.id, secretariatId: secretariat.id, departmentId: department.id },
    update: { name: "Helena Martins", roleId: role.id, secretariatId: secretariat.id, departmentId: department.id, isActive: true },
  });

  const artistPerson = await prisma.person.upsert({
    where: { cpf: "00033344455" },
    create: { fullName: "Rafael Nunes", cpf: "00033344455", email: "rafael.nunes@exemplo.gov.br", phonePrimary: "(00) 90000-0001" },
    update: { fullName: "Rafael Nunes", status: "Ativo" },
  });
  const producerCompany = await prisma.company.upsert({
    where: { cnpj: "22333444000155" },
    create: { corporateName: "Coletivo Aurora Produções Ltda.", cnpj: "22333444000155", emailPrimary: "contato@auroraproducoes.exemplo" },
    update: { corporateName: "Coletivo Aurora Produções Ltda.", status: "Ativo" },
  });
  const supplier = await prisma.supplier.findFirst({ where: { companyId: producerCompany.id } })
    ?? await prisma.supplier.create({ data: { companyId: producerCompany.id, category: "Eventos e Cultura", status: "Ativo" } });

  const artist = await prisma.culturaAgente.upsert({
    where: { cpfCnpj: artistPerson.cpf },
    create: { nome: artistPerson.fullName, tipo: "Artista Individual", segmento: "Música", cpfCnpj: artistPerson.cpf, telefone: artistPerson.phonePrimary, email: artistPerson.email, personId: artistPerson.id },
    update: { nome: artistPerson.fullName, tipo: "Artista Individual", segmento: "Música", telefone: artistPerson.phonePrimary, email: artistPerson.email, personId: artistPerson.id, companyId: null, status: "Ativo", active: true },
  });
  const collective = await prisma.culturaAgente.upsert({
    where: { cpfCnpj: producerCompany.cnpj },
    create: { nome: producerCompany.corporateName, tipo: "Grupo Cultural", segmento: "Artes Cênicas", cpfCnpj: producerCompany.cnpj, email: producerCompany.emailPrimary, companyId: producerCompany.id },
    update: { nome: producerCompany.corporateName, tipo: "Grupo Cultural", segmento: "Artes Cênicas", email: producerCompany.emailPrimary, personId: null, companyId: producerCompany.id, status: "Ativo", active: true },
  });

  const realEstate = await prisma.realEstate.upsert({
    where: { municipalInsc: "IMOV-CUL-2026-001" },
    create: { municipalInsc: "IMOV-CUL-2026-001", propertyType: "Centro Cultural", streetName: "Rua da Cultura", number: "250", status: "Regular" },
    update: { propertyType: "Centro Cultural", streetName: "Rua da Cultura", number: "250", status: "Regular" },
  });
  const assetCategory = await prisma.assetCategory.upsert({
    where: { code: "CUL-EQP" },
    create: { code: "CUL-EQP", name: "Equipamentos Culturais", lifeSpan: 120 },
    update: { name: "Equipamentos Culturais", isActive: true },
  });
  const soundAsset = await prisma.asset.upsert({
    where: { patrimonyNumber: "PAT-CUL-2026-001" },
    create: { patrimonyNumber: "PAT-CUL-2026-001", name: "Sistema de Som do Centro Cultural", status: "Ativo", acquisitionDate: new Date("2025-10-10"), acquisitionValue: 46000, currentValue: 43000, categoryId: assetCategory.id, departmentId: department.id, realEstateId: realEstate.id, responsibleId: coordinator.id },
    update: { status: "Ativo", categoryId: assetCategory.id, departmentId: department.id, realEstateId: realEstate.id, responsibleId: coordinator.id },
  });
  const space = await prisma.culturaEspaco.findFirst({ where: { nome: "Centro Cultural Municipal" } })
    ?? await prisma.culturaEspaco.create({ data: { nome: "Centro Cultural Municipal", tipo: "Centro Cultural", capacidade: 350, status: "Disponível", assetId: soundAsset.id, realEstateId: realEstate.id, responsibleEmployeeId: coordinator.id } });
  await prisma.culturaEspaco.update({ where: { id: space.id }, data: { tipo: "Centro Cultural", capacidade: 350, status: "Disponível", active: true, assetId: soundAsset.id, realEstateId: realEstate.id, responsibleEmployeeId: coordinator.id } });

  const financialYear = await prisma.financialYear.upsert({ where: { year: 2026 }, create: { year: 2026, startDate: new Date("2026-01-01"), endDate: new Date("2026-12-31") }, update: { status: "Aberto" } });
  const budgetUnit = await prisma.budgetUnit.upsert({ where: { code: "UO-CUL-2026" }, create: { code: "UO-CUL-2026", name: "Unidade Orçamentária de Cultura", secretariatId: secretariat.id }, update: { name: "Unidade Orçamentária de Cultura", secretariatId: secretariat.id } });
  const resourceSource = await prisma.resourceSource.upsert({ where: { code: "REC-CUL-001" }, create: { code: "REC-CUL-001", name: "Recursos para Cultura" }, update: { name: "Recursos para Cultura" } });
  const expenseNature = await prisma.expenseNature.upsert({ where: { code: "NAT-CUL-001" }, create: { code: "NAT-CUL-001", name: "Fomento a Projetos Culturais" }, update: { name: "Fomento a Projetos Culturais" } });
  const appropriation = await prisma.budgetAppropriation.upsert({
    where: { code: "DOT-CUL-2026-001" },
    create: { code: "DOT-CUL-2026-001", financialYearId: financialYear.id, budgetUnitId: budgetUnit.id, expenseNatureId: expenseNature.id, resourceSourceId: resourceSource.id, initialValue: 180000, updatedValue: 180000, committedValue: 40000 },
    update: { financialYearId: financialYear.id, budgetUnitId: budgetUnit.id, expenseNatureId: expenseNature.id, resourceSourceId: resourceSource.id },
  });
  const purchaseProcess = await prisma.purchaseProcess.upsert({
    where: { number: "PC-CUL-2026-001" },
    create: { number: "PC-CUL-2026-001", object: "Serviços de produção cultural e locação técnica", type: "Comum", modality: "Pregão", estimatedValue: 40000, status: "Em Andamento", secretariatId: secretariat.id },
    update: { object: "Serviços de produção cultural e locação técnica", estimatedValue: 40000, status: "Em Andamento", secretariatId: secretariat.id },
  });
  const commitment = await prisma.commitment.upsert({
    where: { number: "EMP-CUL-2026-001" },
    create: { number: "EMP-CUL-2026-001", date: new Date("2026-07-01"), value: 40000, type: "Ordinário", history: "Fomento ao Festival de Inverno Municipal.", appropriationId: appropriation.id, supplierId: supplier.id, status: "Emitido" },
    update: { value: 40000, history: "Fomento ao Festival de Inverno Municipal.", appropriationId: appropriation.id, supplierId: supplier.id, status: "Emitido" },
  });

  const project = await prisma.culturaProjeto.upsert({
    where: { numero: "PROJ-CUL-2026-001" },
    create: { numero: "PROJ-CUL-2026-001", nome: "Festival de Inverno Municipal", descricao: "Programação cultural com música, teatro e oficinas abertas à comunidade.", categoria: "Fomento Cultural", status: "Aprovado", valorSolicitado: 40000, agenteId: collective.id, appropriationId: appropriation.id, commitmentId: commitment.id, purchaseProcessId: purchaseProcess.id },
    update: { nome: "Festival de Inverno Municipal", descricao: "Programação cultural com música, teatro e oficinas abertas à comunidade.", categoria: "Fomento Cultural", status: "Aprovado", active: true, valorSolicitado: 40000, agenteId: collective.id, appropriationId: appropriation.id, commitmentId: commitment.id, purchaseProcessId: purchaseProcess.id },
  });
  const event = await prisma.culturaEvento.findFirst({ where: { nome: "Festival de Inverno Municipal 2026" } })
    ?? await prisma.culturaEvento.create({ data: { nome: "Festival de Inverno Municipal 2026", tipo: "Festival", data: new Date("2026-08-15"), local: "Centro Cultural Municipal", publicoAlvo: "Comunidade em geral", status: "Programado", startsAt: new Date("2026-08-15T18:00:00"), endsAt: new Date("2026-08-17T23:00:00"), spaceId: space.id, responsibleEmployeeId: coordinator.id, projectId: project.id } });
  await prisma.culturaEvento.update({ where: { id: event.id }, data: { tipo: "Festival", local: "Centro Cultural Municipal", publicoAlvo: "Comunidade em geral", status: "Programado", active: true, startsAt: new Date("2026-08-15T18:00:00"), endsAt: new Date("2026-08-17T23:00:00"), spaceId: space.id, responsibleEmployeeId: coordinator.id, projectId: project.id } });

  const activity = await prisma.culturaAtividade.findFirst({ where: { nome: "Oficina de Música Popular" } })
    ?? await prisma.culturaAtividade.create({ data: { nome: "Oficina de Música Popular", modalidade: "Música", publicoAlvo: "Adolescentes e adultos", startsAt: new Date("2026-07-20T19:00:00"), endsAt: new Date("2026-10-20T21:00:00"), spaceId: space.id, instructorEmployeeId: coordinator.id, agentId: artist.id } });
  await prisma.culturaAtividade.update({ where: { id: activity.id }, data: { modalidade: "Música", publicoAlvo: "Adolescentes e adultos", status: "Ativa", active: true, spaceId: space.id, instructorEmployeeId: coordinator.id, agentId: artist.id } });

  const reservation = await prisma.culturaReserva.findFirst({ where: { purpose: "Ensaio aberto da Oficina de Música" } })
    ?? await prisma.culturaReserva.create({ data: { startsAt: new Date("2026-07-25T18:00:00"), endsAt: new Date("2026-07-25T21:00:00"), purpose: "Ensaio aberto da Oficina de Música", status: "Aprovada", spaceId: space.id, personId: artistPerson.id, eventId: event.id } });
  await prisma.culturaReserva.update({ where: { id: reservation.id }, data: { status: "Aprovada", active: true, spaceId: space.id, personId: artistPerson.id, companyId: null, eventId: event.id } });

  const heritage = await prisma.culturaPatrimonio.findFirst({ where: { nome: "Centro Cultural Municipal" } })
    ?? await prisma.culturaPatrimonio.create({ data: { nome: "Centro Cultural Municipal", tipo: "Imóvel Histórico", relevanciaCultural: "Referência para a memória e produção cultural local.", situacaoProtecao: "Inventariado", estadoConservacao: "Bom", realEstateId: realEstate.id } });
  await prisma.culturaPatrimonio.update({ where: { id: heritage.id }, data: { tipo: "Imóvel Histórico", relevanciaCultural: "Referência para a memória e produção cultural local.", situacaoProtecao: "Inventariado", estadoConservacao: "Bom", status: "Ativo", active: true, realEstateId: realEstate.id } });

  const council = await prisma.culturaConselho.findFirst({ where: { nome: "Conselho Municipal de Política Cultural" } })
    ?? await prisma.culturaConselho.create({ data: { nome: "Conselho Municipal de Política Cultural", tipo: "Conselho", responsavel: "Helena Martins" } });
  await prisma.culturaFundo.upsert({ where: { nome: "Fundo Municipal de Cultura" }, create: { nome: "Fundo Municipal de Cultura", descricao: "Fundo de apoio e financiamento das políticas culturais.", appropriationId: appropriation.id }, update: { descricao: "Fundo de apoio e financiamento das políticas culturais.", status: "Ativo", active: true, appropriationId: appropriation.id } });

  const folder = await prisma.folder.findFirst({ where: { name: "Cultura e Lazer" } })
    ?? await prisma.folder.create({ data: { name: "Cultura e Lazer", description: "Documentos de eventos, projetos e conselhos culturais.", departmentId: department.id } });
  const projectDocument = await prisma.document.findFirst({ where: { title: "Plano de trabalho - Festival de Inverno 2026", folderId: folder.id } })
    ?? await prisma.document.create({ data: { title: "Plano de trabalho - Festival de Inverno 2026", documentType: "Plano de Trabalho", fileUrl: "/logo1.png", folderId: folder.id, status: "Válido" } });
  const reservationDocument = await prisma.document.findFirst({ where: { title: "Termo de uso - Ensaio aberto Oficina de Música", folderId: folder.id } })
    ?? await prisma.document.create({ data: { title: "Termo de uso - Ensaio aberto Oficina de Música", documentType: "Termo de Uso", fileUrl: "/logo1.png", folderId: folder.id, status: "Válido" } });
  const councilDocument = await prisma.document.findFirst({ where: { title: "Ata do Conselho Municipal de Política Cultural", folderId: folder.id } })
    ?? await prisma.document.create({ data: { title: "Ata do Conselho Municipal de Política Cultural", documentType: "Ata", fileUrl: "/logo1.png", folderId: folder.id, status: "Válido" } });

  await prisma.culturaProjetoDocumento.upsert({ where: { projectId_documentId: { projectId: project.id, documentId: projectDocument.id } }, create: { projectId: project.id, documentId: projectDocument.id, purpose: "Plano de trabalho" }, update: { purpose: "Plano de trabalho" } });
  await prisma.culturaEventoDocumento.upsert({ where: { eventId_documentId: { eventId: event.id, documentId: projectDocument.id } }, create: { eventId: event.id, documentId: projectDocument.id, purpose: "Programação" }, update: { purpose: "Programação" } });
  await prisma.culturaReservaDocumento.upsert({ where: { reservationId_documentId: { reservationId: reservation.id, documentId: reservationDocument.id } }, create: { reservationId: reservation.id, documentId: reservationDocument.id, purpose: "Termo de uso" }, update: { purpose: "Termo de uso" } });
  await prisma.culturaConselhoDocumento.upsert({ where: { councilId_documentId: { councilId: council.id, documentId: councilDocument.id } }, create: { councilId: council.id, documentId: councilDocument.id, purpose: "Ata" }, update: { purpose: "Ata" } });

  console.log("Cenários persistidos de Cultura e Lazer criados ou atualizados.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
