import type { PrismaClient } from "@prisma/client";
import {
  insertOperationalRows,
  operationalId,
  type OperationalSeedReport,
} from "./operational-seed-utils";

const date = (value: string) => new Date(`${value}T12:00:00.000Z`);
const id = (model: string, key: string) => operationalId(`OP-${model}`, key);

export async function seedOperationalCivic(
  prisma: PrismaClient,
  reports: OperationalSeedReport[],
) {
  const [departments, employees, people, secretariats, taxpayers, materials] = await Promise.all([
    prisma.department.findMany({ orderBy: { id: "asc" }, take: 2, select: { id: true } }),
    prisma.employee.findMany({ orderBy: { id: "asc" }, take: 3, select: { id: true, name: true } }),
    prisma.person.findMany({ orderBy: { id: "asc" }, take: 3, select: { id: true, fullName: true } }),
    prisma.secretariat.findMany({ orderBy: { id: "asc" }, take: 1, select: { id: true } }),
    prisma.taxpayer.findMany({ orderBy: { id: "asc" }, take: 1, select: { id: true } }),
    prisma.material.findMany({ orderBy: { id: "asc" }, take: 1, select: { id: true } }),
  ]);

  const department = departments[0];
  const employee = employees[0];
  const person = people[0];
  const secretariat = secretariats[0];
  const material = materials[0];
  if (!department) throw new Error("Seed operacional cívico requer ao menos um departamento importado.");
  if (!employee) throw new Error("Seed operacional cívico requer ao menos um servidor importado.");
  if (!person) throw new Error("Seed operacional cívico requer ao menos uma pessoa importada.");
  if (!secretariat) throw new Error("Seed operacional cívico requer ao menos uma secretaria importada.");
  if (!material) throw new Error("Seed operacional cívico requer ao menos um material importado.");

  const secondDepartment = departments[1] ?? department;
  const secondEmployee = employees[1] ?? employee;
  const secondPerson = people[1] ?? person;

  // Atendimento e Ouvidoria
  const channelPortalId = id("CHANNEL", "portal-servicos");
  const channelDeskId = id("CHANNEL", "balcao-cidadao");
  const subjectId = id("SUBJECT", "manutencao-vias");
  const ticketId = id("TICKET", "2026-0001");
  const ombudsmanId = id("OMB", "2026-0001");
  await insertOperationalRows(prisma, "supportChannel", [
    { id: channelPortalId, name: "Portal de Serviços", description: "Solicitações digitais acompanhadas por protocolo.", sortOrder: 1 },
    { id: channelDeskId, name: "Central de Atendimento", description: "Atendimento presencial ao cidadão.", sortOrder: 2 },
  ], reports);
  await insertOperationalRows(prisma, "serviceSubject", [{
    id: subjectId,
    name: "Conservação de vias e calçadas",
    description: "Triagem de reparos em pavimento, passeio e sinalização.",
    defaultDepartmentId: department.id,
    defaultPriority: "Normal",
    defaultDueDays: 10,
  }], reports);
  await insertOperationalRows(prisma, "ticket", [{
    id: ticketId,
    ticketNumber: "TKT-2026-0001",
    subject: "Reparo de pavimento na Rua das Palmeiras",
    description: "Desgaste do pavimento próximo ao cruzamento principal.",
    status: "Em Atendimento",
    priority: "Alta",
    dueAt: date("2026-02-18"),
    channelId: channelPortalId,
    personId: person.id,
    departmentId: department.id,
    assigneeId: employee.id,
    serviceSubjectId: subjectId,
    createdAt: date("2026-02-08"),
  }], reports);
  await insertOperationalRows(prisma, "ticketInteraction", [
    { id: id("TICKET-INT", "2026-0001-registro"), ticketId, message: "Solicitação recebida e classificada para vistoria.", type: "Registro", employeeId: employee.id, createdAt: date("2026-02-08") },
    { id: id("TICKET-INT", "2026-0001-vistoria"), ticketId, message: "Vistoria confirmou necessidade de recomposição localizada.", type: "Comentário", isInternal: true, employeeId: employee.id, createdAt: date("2026-02-10") },
  ], reports);
  await insertOperationalRows(prisma, "ticketMovement", [{
    id: id("TICKET-MOV", "2026-0001-encaminhamento"), ticketId, toDepartmentId: department.id,
    toAssigneeId: employee.id, employeeId: employee.id, reason: "Encaminhamento para equipe de conservação.", createdAt: date("2026-02-09"),
  }], reports);
  await insertOperationalRows(prisma, "ombudsman", [{
    id: ombudsmanId,
    protocolNumber: "OUV-2026-0001",
    type: "Sugestão",
    subject: "Ampliação do horário da biblioteca",
    description: "Sugestão de atendimento em um sábado por mês.",
    status: "Concluída",
    channelId: channelDeskId,
    personId: secondPerson.id,
    departmentId: secondDepartment.id,
    assigneeId: secondEmployee.id,
    response: "A agenda mensal passou a incluir atendimento no primeiro sábado.",
    respondedAt: date("2026-03-05"),
    respondedById: secondEmployee.id,
    concludedAt: date("2026-03-06"),
    concludedById: secondEmployee.id,
    createdAt: date("2026-02-20"),
  }], reports);
  await insertOperationalRows(prisma, "ombudsmanMovement", [{
    id: id("OMB-MOV", "2026-0001-encaminhamento"), ombudsmanId, toDepartmentId: secondDepartment.id,
    employeeId: secondEmployee.id, reason: "Análise de disponibilidade da unidade cultural.", createdAt: date("2026-02-21"),
  }], reports);
  await insertOperationalRows(prisma, "ombudsmanInteraction", [{
    id: id("OMB-INT", "2026-0001-resposta"), ombudsmanId, type: "Resposta",
    message: "Proposta incorporada ao calendário mensal da biblioteca.", isInternal: false,
    employeeId: secondEmployee.id, createdAt: date("2026-03-05"),
  }], reports);

  // Portal e Transparência
  const menuId = id("PORTAL-MENU", "servicos");
  await insertOperationalRows(prisma, "portalMenu", [
    { id: menuId, name: "Serviços", url: "/servicos", order: 1 },
    { id: id("PORTAL-MENU", "servicos-atendimento"), name: "Atendimento ao cidadão", url: "/servicos/atendimento", parentId: menuId, order: 1 },
  ], reports);
  await insertOperationalRows(prisma, "portalPage", [{
    id: id("PORTAL-PAGE", "carta-de-servicos"), title: "Carta de Serviços", slug: "carta-de-servicos",
    content: "Consulte requisitos, prazos e canais dos serviços municipais.", status: "Publicado", authorId: employee.id,
  }], reports);
  await insertOperationalRows(prisma, "portalNews", [{
    id: id("PORTAL-NEWS", "calendario-coleta-seletiva-2026"), title: "Coleta seletiva amplia roteiro semanal",
    subtitle: "Novos pontos passam a integrar o calendário municipal", slug: "coleta-seletiva-amplia-roteiro-semanal",
    content: "O roteiro atualizado contempla bairros centrais e comunidades rurais.", status: "Publicado",
    publishedAt: date("2026-03-12"), authorId: employee.id, secretariatId: secretariat.id,
  }], reports);
  await insertOperationalRows(prisma, "portalBanner", [{
    id: id("PORTAL-BANNER", "prestacao-contas-2026"), title: "Prestação de contas municipal",
    imageUrl: "/portal/banners/prestacao-contas-2026.webp", linkUrl: "/transparencia/prestacao-de-contas",
    position: "Principal", order: 1, status: "Ativo", startDate: date("2026-01-15"), endDate: date("2026-12-31"),
  }], reports);
  await insertOperationalRows(prisma, "officialPublication", [{
    id: id("PUBLICATION", "audiencia-metas-1q-2026"), title: "Audiência pública de metas fiscais do primeiro quadrimestre",
    category: "Comunicado", description: "Convocação para apresentação e avaliação das metas fiscais.",
    linkUrl: "/transparencia/audiencias/metas-1q-2026", publishDate: date("2026-05-10"), validUntil: date("2026-05-28"),
  }], reports);
  await insertOperationalRows(prisma, "officialDiary", [{
    id: id("OFFICIAL-DIARY", "2026-184"), editionNumber: 2026184, publishDate: date("2026-09-18"),
    pdfUrl: "/diario-oficial/2026/edicao-184.pdf", status: "Publicado", authorId: employee.id,
  }], reports);
  await insertOperationalRows(prisma, "publicService", [{
    id: id("PUBLIC-SERVICE", "certidao-negativa"), name: "Emissão de certidão negativa de débitos",
    description: "Consulta fiscal e emissão digital de certidão municipal.", target: "Cidadão e empresa",
    requirements: "Documento de identificação e inscrição municipal, quando aplicável.",
    steps: "Identificar o contribuinte, consultar pendências e emitir a certidão.", deadline: "Imediato", cost: "Gratuito",
    linkUrl: "/servicos/certidao-negativa", isActive: true,
  }], reports);
  await insertOperationalRows(prisma, "informationRequest", [{
    id: id("SIC", "2026-0001"), protocolNumber: "SIC-2026-0001", subject: "Cronograma de manutenção de praças",
    description: "Solicitação do cronograma previsto para o primeiro semestre.", status: "Respondido",
    answer: "O cronograma está publicado na seção de planejamento urbano.", requesterName: secondPerson.fullName,
    requesterEmail: "cidadao@municipio.invalid", requesterDoc: "Identificação validada no atendimento", createdAt: date("2026-01-22"),
  }], reports);

  // Tributação
  const taxpayerId = taxpayers[0]?.id ?? id("TAXPAYER", person.id);
  if (!taxpayers[0]) {
    await insertOperationalRows(prisma, "taxpayer", [{
      id: taxpayerId, taxpayerType: "PF", municipalInsc: "IM-260001", status: "Ativo",
      fiscalNotes: "Cadastro vinculado ao atendimento tributário municipal.", personId: person.id,
    }], reports);
  }
  const taxId = id("TAX", "iptu");
  const issTaxId = id("TAX", "iss");
  const assessmentId = id("ASSESSMENT", "iptu-2026-0001");
  const guideId = id("TAX-GUIDE", "iptu-2026-0001-01");
  await insertOperationalRows(prisma, "tax", [
    { id: taxId, name: "Imposto Predial e Territorial Urbano", taxType: "Imposto" },
    { id: issTaxId, name: "Imposto sobre Serviços", taxType: "Imposto" },
    { id: id("TAX", "taxa-residuos"), name: "Taxa de Manejo de Resíduos Sólidos", taxType: "Taxa" },
  ], reports);
  await insertOperationalRows(prisma, "economicRegistration", [{
    id: id("ECONOMIC", "260001"), municipalInsc: "EC-260001", primaryCnae: "9602-5/01",
    taxRegime: "Autônomo", status: "Ativo", startDate: date("2024-04-02"), taxpayerId,
  }], reports);
  await insertOperationalRows(prisma, "taxAssessment", [{
    id: assessmentId, year: 2026, originalValue: 486.72, assessmentNumber: "LAN-2026-000001",
    competence: date("2026-01-01"), status: "Pago", taxId, taxpayerId, createdAt: date("2026-01-10"),
  }], reports);
  await insertOperationalRows(prisma, "taxGuide", [{
    id: guideId, barcode: "836600000048867200132026600000000101260000000001", guideNumber: "DAM-2026-000001",
    totalValue: 486.72, dueDate: date("2026-02-10"), status: "Paga", assessmentId, createdAt: date("2026-01-10"),
  }], reports);
  await insertOperationalRows(prisma, "taxPayment", [{
    id: id("TAX-PAYMENT", "iptu-2026-0001"), amountPaid: 486.72, status: "Confirmado",
    idempotencyKey: "TRIB-2026-IPTU-000001", sourceId: guideId, paymentDate: date("2026-02-06"),
    clearanceDate: date("2026-02-07"), paymentMethod: "PIX", guideId,
  }], reports);
  await insertOperationalRows(prisma, "taxCertificate", [{
    id: id("TAX-CERT", "2026-0001"), certificateType: "CND", authCode: "CND-2026-A7F31C9D",
    validUntil: date("2026-08-06"), status: "Emitida", taxpayerId, createdAt: date("2026-02-07"),
  }], reports);
  const serviceActivityId = id("TAX-ACTIVITY", "servicos-administrativos");
  await insertOperationalRows(prisma, "taxParameter", [{
    id: id("TAX-PARAMETER", "iptu-2026"), taxId, code: "IPTU_ALIQUOTA_URBANA",
    name: "Alíquota urbana do IPTU", calculationType: "PERCENTUAL",
    configuration: { rate: 0.006, basis: "VALOR_VENAL" }, effectiveFrom: date("2026-01-01"), isActive: true,
  }], reports);
  await insertOperationalRows(prisma, "taxServiceActivity", [{
    id: serviceActivityId, taxId: issTaxId, code: "17.01", name: "Assessoria e consultoria administrativa", issRate: 0.03,
  }], reports);
  await insertOperationalRows(prisma, "taxDeclaration", [{
    id: id("TAX-DECLARATION", "260001-2026-02"), taxpayerId, economicRegistrationId: id("ECONOMIC", "260001"),
    activityId: serviceActivityId, competence: date("2026-02-01"), serviceValueDecimal: 4200,
    deductionValueDecimal: 0, issValueDecimal: 126, status: "APURADA_INTERNA",
    calculationSnapshot: { rate: 0.03, serviceValue: 4200, issValue: 126 },
  }], reports);
  await insertOperationalRows(prisma, "license", [{
    id: id("TAX-LICENSE", "260001-2026"), licenseType: "Alvará de Funcionamento", status: "Emitido",
    issueDate: date("2026-01-20"), validUntil: date("2026-12-31"), qrCode: "ALV-2026-260001",
    taxpayerId, economicRegistrationId: id("ECONOMIC", "260001"),
  }], reports);
  await insertOperationalRows(prisma, "invoice", [{
    id: id("TAX-INVOICE", "260001-2026-001"), verificationCode: "NFSE-2026-260001-A91F",
    serviceValue: 4200, serviceValueDecimal: 4200, deductions: 0, deductionsDecimal: 0,
    issRetained: false, issValue: 126, issValueDecimal: 126, competence: "02/2026", status: "Emitida",
    providerId: taxpayerId,
  }], reports);

  // Centros de custo
  await insertOperationalRows(prisma, "costCenter", [
    { id: id("COST-CENTER", "obras-urbanas"), code: "CC-OBRAS-URBANAS", name: "Obras e Conservação Urbana", description: "Custos de manutenção da infraestrutura urbana." },
    { id: id("COST-CENTER", "servicos-ambientais"), code: "CC-SERVICOS-AMBIENTAIS", name: "Serviços Ambientais", description: "Custos de fiscalização, educação ambiental e manejo de resíduos." },
  ], reports);

  // Meio Ambiente
  const enterpriseId = id("ENV-ENTERPRISE", "cooperativa-reciclagem-central");
  await insertOperationalRows(prisma, "envEnterprise", [{
    id: enterpriseId, name: "Cooperativa Recicla Central", activityType: "Triagem de recicláveis",
    potentialRisk: "Médio", address: "Distrito Industrial, lote 12", status: "Ativo",
  }], reports);
  await insertOperationalRows(prisma, "envLicense", [{
    id: id("ENV-LICENSE", "las-2026-014"), licenseNumber: "LAS-2026-014", licenseType: "Simplificada",
    issueDate: date("2026-01-19"), validUntil: date("2028-01-19"), status: "Emitida", enterpriseId,
  }], reports);
  await insertOperationalRows(prisma, "envRequest", [{
    id: id("ENV-REQUEST", "poda-2026-031"), requestType: "Poda", description: "Avaliação de galhos sobre a rede de iluminação.",
    address: "Avenida do Comércio, 240", requesterName: secondPerson.fullName, status: "Em Vistoria", createdAt: date("2026-03-02"),
  }], reports);
  await insertOperationalRows(prisma, "envComplaint", [{
    id: id("ENV-COMPLAINT", "descarte-2026-018"), complaintType: "Descarte irregular",
    description: "Resíduos de construção depositados em área pública.", address: "Estrada do Barreiro, km 2",
    isAnonymous: true, status: "Em Vistoria", createdAt: date("2026-02-25"),
  }], reports);
  await insertOperationalRows(prisma, "envInspection", [{
    id: id("ENV-INSPECTION", "cooperativa-2026-01"), dateScheduled: date("2026-04-08"), dateExecuted: date("2026-04-08"),
    inspector: employee.name, notes: "Armazenamento organizado e controles de destinação disponíveis.", status: "Realizada", enterpriseId,
  }], reports);
  await insertOperationalRows(prisma, "envInfraction", [{
    id: id("ENV-INFRACTION", "notificacao-2026-004"), infractionType: "Notificação",
    description: "Adequar identificação da área de armazenamento temporário.", status: "Emitido", enterpriseId,
  }], reports);
  await insertOperationalRows(prisma, "envGreenArea", [{
    id: id("ENV-GREEN", "parque-municipal-das-nascentes"), name: "Parque Municipal das Nascentes", areaType: "Parque",
    sizeSqm: 18400, location: "Bairro Alto da Serra", status: "Em Recuperação", notes: "Recomposição vegetal nas margens do córrego.",
  }], reports);
  await insertOperationalRows(prisma, "envWaste", [{
    id: id("ENV-WASTE", "cooperativa-2026-03"), generatorName: "Cooperativa Recicla Central", wasteType: "Reciclável",
    quantityKg: 4280, destination: "Reciclagem", date: date("2026-03-31"), enterpriseId,
  }], reports);
  await insertOperationalRows(prisma, "envEduProgram", [{
    id: id("ENV-EDU", "escola-sem-desperdicio-2026"), title: "Escola sem Desperdício",
    description: "Ações de separação de resíduos e compostagem nas escolas municipais.", targetAudience: "Comunidade escolar",
    startDate: date("2026-02-09"), endDate: date("2026-11-30"), participantsCount: 320, status: "Em Execução",
  }], reports);
  await insertOperationalRows(prisma, "envDocument", [{
    id: id("ENV-DOCUMENT", "parecer-las-2026-014"), title: "Parecer técnico da licença LAS-2026-014",
    docType: "Parecer Técnico", fileUrl: "/ambiente/documentos/parecer-las-2026-014.pdf", enterpriseId,
  }], reports);

  // Água e Saneamento
  const sanUnitId = id("SAN-UNIT", "000184");
  const meterId = id("SAN-METER", "H260184");
  await insertOperationalRows(prisma, "sanConsumerUnit", [{
    id: sanUnitId, code: "UC-000184", address: "Rua do Ipê, 184", category: "Residencial",
    status: "Ativa", ownerName: person.fullName, ownerDocument: "Cadastro municipal validado",
  }], reports);
  await insertOperationalRows(prisma, "sanWaterMeter", [{
    id: meterId, meterNumber: "H260184", installation: date("2023-06-14"), status: "Instalado", unitId: sanUnitId,
  }], reports);
  await insertOperationalRows(prisma, "sanMeterReading", [
    { id: id("SAN-READING", "000184-02-2026"), competence: "02/2026", previousValue: 412, currentValue: 425, consumption: 13, readingDate: date("2026-02-21"), readerName: employee.name, status: "Registrada", unitId: sanUnitId, meterId },
    { id: id("SAN-READING", "000184-03-2026"), competence: "03/2026", previousValue: 425, currentValue: 437, consumption: 12, readingDate: date("2026-03-21"), readerName: employee.name, status: "Registrada", unitId: sanUnitId, meterId },
  ], reports);
  await insertOperationalRows(prisma, "sanInvoice", [
    { id: id("SAN-INVOICE", "000184-02-2026"), invoiceNumber: "SAN-2026-000184-02", competence: "02/2026", totalAmount: 58.4, dueDate: date("2026-03-10"), status: "Paga", unitId: sanUnitId },
    { id: id("SAN-INVOICE", "000184-03-2026"), invoiceNumber: "SAN-2026-000184-03", competence: "03/2026", totalAmount: 55.2, dueDate: date("2026-04-10"), status: "Emitida", unitId: sanUnitId },
  ], reports);
  await insertOperationalRows(prisma, "sanServiceOrder", [{
    id: id("SAN-ORDER", "2026-0071"), orderNumber: "OS-SAN-2026-0071", orderType: "Vazamento",
    description: "Verificação de umidade junto ao cavalete.", priority: "Alta", status: "Concluída",
    technician: secondEmployee.name, unitId: sanUnitId, createdAt: date("2026-03-04"),
  }], reports);
  await insertOperationalRows(prisma, "sanWaterQualityAnalysis", [{
    id: id("SAN-QUALITY", "reservatorio-central-2026-03-cloro"), collectionPoint: "Reservatório Central",
    collectedAt: date("2026-03-18"), parameter: "Cloro residual livre", result: "0,8 mg/L", limit: "0,2 a 5,0 mg/L", compliance: "Conforme",
  }], reports);
  await insertOperationalRows(prisma, "sanPortalRequest", [{
    id: id("SAN-PORTAL", "2026-0042"), requestType: "Segunda via", requesterName: secondPerson.fullName,
    requestedAt: date("2026-03-15"), source: "Portal do Cidadão", status: "Atendida",
  }], reports);
  await insertOperationalRows(prisma, "sanSavedReport", [{
    id: id("SAN-REPORT", "consumo-1t-2026"), name: "Consumo por categoria - 1º trimestre de 2026",
    type: "Consumo", period: "01/2026 a 03/2026", format: "PDF",
  }], reports);

  // Obras e Infraestrutura
  const obraId = id("OBRA", "2026-001");
  const serviceId = id("OBRAS-SERVICE", "2026-0048");
  const teamId = id("OBRAS-TEAM", "conservacao-01");
  await insertOperationalRows(prisma, "obrasObra", [{
    id: obraId, numero: "OBR-2026-001", nome: "Revitalização da Praça da Estação",
    descricao: "Requalificação de passeios, iluminação e paisagismo.", local: "Praça da Estação", tipo: "Reforma",
    valorEstimado: 385000, status: "Em Execução",
  }], reports);
  await insertOperationalRows(prisma, "obrasMedicao", [
    { id: id("OBRAS-MEASUREMENT", "2026-001-01"), numero: 1, data: date("2026-03-30"), valorMedido: 74250, status: "Aprovada", obraId },
    { id: id("OBRAS-MEASUREMENT", "2026-001-02"), numero: 2, data: date("2026-04-30"), valorMedido: 91800, status: "Em Análise", obraId },
  ], reports);
  await insertOperationalRows(prisma, "obrasServico", [{
    id: serviceId, protocolo: "OS-OBR-2026-0048", tipo: "Tapa-buraco",
    descricao: "Recomposição localizada após vistoria do atendimento.", local: "Rua das Palmeiras, cruzamento principal",
    status: "Em Andamento", scheduledFor: date("2026-02-14"), estimatedCost: 2860, departmentId: department.id,
  }], reports);
  await insertOperationalRows(prisma, "obrasEquipe", [{
    id: teamId, code: "EQ-CONS-01", name: "Equipe de Conservação Viária", departmentId: department.id,
  }], reports);
  await insertOperationalRows(prisma, "obrasEquipeMembro", [{
    id: id("OBRAS-MEMBER", `${teamId}-${employee.id}`), equipeId: teamId, employeeId: employee.id, isLeader: true,
  }], reports);
  await insertOperationalRows(prisma, "obrasServicoEmployee", [{
    id: id("OBRAS-ASSIGNEE", `${serviceId}-${employee.id}`), obrasServicoId: serviceId, employeeId: employee.id,
    role: "Encarregado", assignedAt: date("2026-02-12"),
  }], reports);
  await insertOperationalRows(prisma, "obrasServicoEquipe", [{
    id: id("OBRAS-TEAM-ASSIGNMENT", `${serviceId}-${teamId}`), obrasServicoId: serviceId, equipeId: teamId,
    assignedAt: date("2026-02-12"),
  }], reports);
  await insertOperationalRows(prisma, "obrasServicoMaterial", [{
    id: id("OBRAS-MATERIAL", `${serviceId}-${material.id}`), obrasServicoId: serviceId, materialId: material.id,
    quantityPlanned: 18, quantityIssued: 12, unitCost: 42.5,
  }], reports);

  // Cultura, Esporte e Lazer
  const agentId = id("CULTURA-AGENT", person.id);
  const spaceId = id("CULTURA-SPACE", "centro-cultural-municipal");
  const projectId = id("CULTURA-PROJECT", "2026-001");
  const eventId = id("CULTURA-EVENT", "mostra-saberes-locais-2026");
  await insertOperationalRows(prisma, "culturaAgente", [{
    id: agentId, nome: person.fullName, tipo: "Artista Individual", segmento: "Artes Visuais",
    status: "Ativo", personId: person.id,
  }], reports);
  await insertOperationalRows(prisma, "culturaEspaco", [{
    id: spaceId, nome: "Centro Cultural Municipal", tipo: "Centro Cultural", endereco: "Rua da Matriz, 45",
    capacidade: 180, status: "Disponível", responsibleEmployeeId: secondEmployee.id,
  }], reports);
  await insertOperationalRows(prisma, "culturaProjeto", [{
    id: projectId, numero: "CULT-2026-001", nome: "Memórias do Município",
    descricao: "Registro de relatos, fotografias e ofícios tradicionais.", categoria: "Memória e Patrimônio",
    status: "Aprovado", valorSolicitado: 28000, agenteId: agentId,
  }], reports);
  await insertOperationalRows(prisma, "culturaEvento", [{
    id: eventId, nome: "Mostra de Saberes Locais", tipo: "Exposição", data: date("2026-06-20"),
    local: "Centro Cultural Municipal", publicoAlvo: "Comunidade em geral", status: "Programado",
    startsAt: date("2026-06-20"), endsAt: date("2026-06-22"), spaceId, responsibleEmployeeId: secondEmployee.id, projectId,
  }], reports);
  await insertOperationalRows(prisma, "culturaAtividade", [{
    id: id("CULTURA-ACTIVITY", "oficina-fotografia-documental-2026"), nome: "Oficina de Fotografia Documental",
    modalidade: "Oficina", publicoAlvo: "Jovens e adultos", startsAt: date("2026-04-07"), endsAt: date("2026-05-26"),
    status: "Ativa", spaceId, instructorEmployeeId: secondEmployee.id, agentId,
  }], reports);
  await insertOperationalRows(prisma, "culturaReserva", [{
    id: id("CULTURA-RESERVATION", "mostra-saberes-2026"), startsAt: date("2026-06-19"), endsAt: date("2026-06-23"),
    purpose: "Montagem e realização da Mostra de Saberes Locais", status: "Confirmada", spaceId, personId: person.id, eventId,
  }], reports);
  await insertOperationalRows(prisma, "culturaPatrimonio", [{
    id: id("CULTURA-HERITAGE", "coreto-praca-matriz"), nome: "Coreto da Praça da Matriz", tipo: "Bem edificado",
    relevanciaCultural: "Referência de encontros comunitários e apresentações musicais.", situacaoProtecao: "Inventariado",
    estadoConservacao: "Bom", status: "Ativo",
  }], reports);
  await insertOperationalRows(prisma, "culturaConselho", [{
    id: id("CULTURA-COUNCIL", "municipal-cultura"), nome: "Conselho Municipal de Política Cultural",
    tipo: "Deliberativo", status: "Ativo", responsavel: employee.name,
  }], reports);
  await insertOperationalRows(prisma, "culturaFundo", [{
    id: id("CULTURA-FUND", "municipal-cultura"), nome: "Fundo Municipal de Cultura",
    status: "Ativo", descricao: "Financiamento de ações culturais previstas no plano municipal.",
  }], reports);

  // Câmara Municipal
  const legislatureId = id("CAM-LEGISLATURE", "2025-2028");
  const councilorId = id("CAM-COUNCILOR", person.id);
  const sessionId = id("CAM-SESSION", "2026-004");
  const propositionId = id("CAM-PROPOSITION", "pl-2026-007");
  const commissionId = id("CAM-COMMISSION", "legislacao-justica");
  const voteId = id("CAM-VOTE", "pl-2026-007");
  await insertOperationalRows(prisma, "camLegislatura", [{
    id: legislatureId, numero: 20, inicio: date("2025-01-01"), fim: date("2028-12-31"), status: "Ativa",
    descricao: "Legislatura municipal 2025-2028", secretariatId: secretariat.id,
  }], reports);
  await insertOperationalRows(prisma, "camVereador", [{
    id: councilorId, nomeCompleto: person.fullName, nomeParlamentar: person.fullName.split(" ").slice(0, 2).join(" "),
    partido: "Representação Municipal", status: "Em Exercício", personId: person.id, legislaturaId: legislatureId,
  }], reports);
  await insertOperationalRows(prisma, "camSessao", [{
    id: sessionId, numero: 2026004, tipo: "Ordinária", data: date("2026-03-17"), local: "Plenário Municipal",
    status: "Encerrada", quorum: 1, legislaturaId: legislatureId,
  }], reports);
  await insertOperationalRows(prisma, "camProposicao", [{
    id: propositionId, numero: "PL-007/2026", tipo: "Projeto de Lei",
    ementa: "Institui diretrizes para o programa municipal de arborização urbana.",
    texto: "Estabelece planejamento, manejo e participação comunitária na arborização urbana.", status: "Aprovada",
    dataProtocolo: date("2026-03-02"), autorId: councilorId, sessaoId: sessionId,
  }], reports);
  await insertOperationalRows(prisma, "camComissao", [{
    id: commissionId, nome: "Comissão de Legislação e Justiça", sigla: "CLJ", tipo: "Permanente",
    descricao: "Análise de constitucionalidade e técnica legislativa.", legislaturaId: legislatureId,
  }], reports);
  await insertOperationalRows(prisma, "camComissaoMembro", [{
    id: id("CAM-COMMISSION-MEMBER", `${commissionId}-${councilorId}`), cargo: "Presidente",
    comissaoId: commissionId, vereadorId: councilorId,
  }], reports);
  await insertOperationalRows(prisma, "camMesaDiretora", [{
    id: id("CAM-BOARD", `${legislatureId}-${councilorId}`), cargo: "Presidente", legislaturaId: legislatureId, vereadorId: councilorId,
  }], reports);
  await insertOperationalRows(prisma, "camGabinete", [{
    id: id("CAM-OFFICE", councilorId), sala: "Sala 03", andar: "Térreo", ramal: "203", vereadorId: councilorId,
  }], reports);
  await insertOperationalRows(prisma, "camParecer", [{
    id: id("CAM-OPINION", "pl-2026-007-clj"), tipo: "Comissão",
    conteudo: "A proposição atende aos requisitos de iniciativa e técnica legislativa.", resultado: "Favorável",
    proposicaoId: propositionId, comissaoId: commissionId, createdAt: date("2026-03-10"),
  }], reports);
  await insertOperationalRows(prisma, "camPauta", [{
    id: id("CAM-AGENDA", "2026-004-01"), ordem: 1, tipo: "Deliberativo",
    descricao: "Discussão e votação do PL-007/2026", status: "Aprovada", sessaoId: sessionId, proposicaoId: propositionId,
  }], reports);
  await insertOperationalRows(prisma, "camVotacao", [{
    id: voteId, modalidade: "Nominal", resultado: "Aprovada", votosSim: 1, votosNao: 0, abstencoes: 0,
    proposicaoId: propositionId, sessaoId: sessionId, createdAt: date("2026-03-17"),
  }], reports);
  await insertOperationalRows(prisma, "camVoto", [{
    id: id("CAM-INDIVIDUAL-VOTE", `${voteId}-${councilorId}`), voto: "Sim", votacaoId: voteId, vereadorId: councilorId,
  }], reports);
  await insertOperationalRows(prisma, "camPresencaSessao", [{
    id: id("CAM-ATTENDANCE", `${sessionId}-${councilorId}`), status: "Presente", sessaoId: sessionId, vereadorId: councilorId,
  }], reports);
  await insertOperationalRows(prisma, "camAta", [{
    id: id("CAM-MINUTES", "2026-004"), numero: "ATA-004/2026",
    conteudo: "Sessão ordinária com deliberação da pauta e aprovação do projeto de arborização urbana.",
    status: "Publicada", dataAprovacao: date("2026-03-24"), sessaoId: sessionId,
  }], reports);
  await insertOperationalRows(prisma, "camLei", [{
    id: id("CAM-LAW", "2026-1187"), numero: "1.187/2026", tipo: "Lei Ordinária",
    ementa: "Institui diretrizes para o programa municipal de arborização urbana.",
    dataPublicacao: date("2026-04-01"), dataVigor: date("2026-04-01"), status: "Vigente", proposicaoId: propositionId,
  }], reports);
  await insertOperationalRows(prisma, "camAudiencia", [{
    id: id("CAM-HEARING", "ppa-2026"), tema: "Prioridades para revisão do planejamento plurianual",
    descricao: "Escuta pública para consolidação das prioridades municipais.", data: date("2026-05-14"),
    local: "Plenário Municipal", tipo: "Pública", status: "Agendada", legislaturaId: legislatureId,
  }], reports);

  // Segurança Pública e Mobilidade
  const guardId = id("SECURITY-GUARD", employee.id);
  const occurrenceId = id("SECURITY-OCCURRENCE", "2026-0037");
  await insertOperationalRows(prisma, "segurancaGuarda", [{
    id: guardId, matricula: "GCM-0261", nome: employee.name, tipo: "Guarda Municipal",
    equipe: "Patrulhamento Comunitário", status: "Ativo", employeeId: employee.id,
  }], reports);
  await insertOperationalRows(prisma, "segurancaOcorrencia", [{
    id: occurrenceId, numero: "OC-2026-0037", tipo: "Risco Estrutural",
    descricao: "Sinalização preventiva após queda parcial de galho sobre a via.", local: "Avenida do Comércio, 240",
    bairro: "Centro", prioridade: "Alta", status: "Resolvida", responsavelGuardaId: guardId,
    createdAt: date("2026-03-02"),
  }], reports);
  await insertOperationalRows(prisma, "segurancaInfracao", [{
    id: id("SECURITY-INFRACTION", "2026-0018"), auto: "AIT-2026-0018", data: date("2026-02-16"),
    placa: "MUN2A61", tipo: "Estacionamento irregular", local: "Praça da Estação", valor: 130.16, status: "Notificado",
  }], reports);
  await insertOperationalRows(prisma, "segurancaMobilidadeRegistro", [{
    id: id("SECURITY-MOBILITY", "ronda-centro-2026-03-02"), codigo: "MOB-2026-0062", categoria: "Ronda",
    tipo: "Patrulhamento preventivo", titulo: "Ronda comunitária no Centro", descricao: "Percurso preventivo em áreas comerciais e equipamentos públicos.",
    local: "Região central", bairro: "Centro", responsavel: employee.name, prioridade: "Normal", status: "Concluído",
    dataInicio: date("2026-03-02"), dataFim: date("2026-03-02"), relatedModule: "SEGURANCA", relatedId: occurrenceId,
  }], reports);

  // Controle Interno
  const controlPlanId = id("CONTROL-PLAN", "2026-almoxarifado");
  await insertOperationalRows(prisma, "internalControlPlan", [{
    id: controlPlanId, title: "Verificação dos controles de almoxarifado", reference: "PCI-2026-02",
    status: "ABERTO", dueAt: date("2026-06-30"), ownerId: employee.id, createdAt: date("2026-02-03"),
  }], reports);
  await insertOperationalRows(prisma, "internalControlFinding", [
    { id: id("CONTROL-FINDING", "2026-almoxarifado-01"), planId: controlPlanId, title: "Inventário rotativo sem calendário formal", description: "Formalizar calendário trimestral e responsáveis por grupo de materiais.", status: "EM_TRATAMENTO", dueAt: date("2026-05-30"), responsibleId: employee.id, createdAt: date("2026-02-18") },
    { id: id("CONTROL-FINDING", "2026-almoxarifado-02"), planId: controlPlanId, title: "Conferência de recebimento documentada", description: "Amostra verificada apresentou ateste e vinculação ao movimento de entrada.", status: "RESOLVIDO", responsibleId: secondEmployee.id, resolvedAt: date("2026-03-12"), createdAt: date("2026-02-18") },
  ], reports);

  // Comunicação institucional
  await insertOperationalRows(prisma, "publicityCampaign", [{
    id: id("PUBLICITY", "vacina-em-dia-2026"), name: "Vacina em Dia 2026", agency: "Assessoria Municipal de Comunicação",
    contractNumber: "COM-2026-003", approvedBudgetDecimal: 18500,
    startDate: date("2026-03-01"), endDate: date("2026-04-30"), status: "Ativa",
  }], reports);
}
