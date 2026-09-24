import type { PrismaClient } from "@prisma/client";
import {
  insertOperationalRows,
  operationalId,
  type OperationalSeedReport,
} from "./operational-seed-utils";

const at = (month: number, day: number, hour = 12) =>
  new Date(Date.UTC(2026, month - 1, day, hour));

function required<T>(value: T | null | undefined, label: string): T {
  if (value == null) {
    throw new Error(`Seed operacional: parent essencial ausente (${label}).`);
  }
  return value;
}

export async function seedOperationalProcesses(
  prisma: PrismaClient,
  reports: OperationalSeedReport[],
) {
  const [
    process,
    departments,
    employee,
    actor,
    financialYear,
    resourceSource,
    bankAccount,
    purchaseRequest,
    purchaseProcesses,
    contract,
    supplier,
    asset,
    material,
    schoolClass,
  ] = await Promise.all([
    prisma.process.findFirst({
      orderBy: { id: "asc" },
      select: { id: true, processTypeId: true, subjectId: true, currentDepartmentId: true },
    }),
    prisma.department.findMany({
      orderBy: { id: "asc" },
      take: 2,
      select: { id: true },
    }),
    prisma.employee.findFirst({
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    }),
    prisma.usuario.findFirst({
      orderBy: { id: "asc" },
      select: { id: true, nome: true, email: true, employeeId: true },
    }),
    prisma.financialYear.findFirst({
      where: { year: 2026 },
      orderBy: { id: "asc" },
      select: { id: true, year: true },
    }),
    prisma.resourceSource.findFirst({
      orderBy: { id: "asc" },
      select: { id: true },
    }),
    prisma.bankAccount.findFirst({
      orderBy: { id: "asc" },
      select: { id: true, bankName: true, agency: true, accountNumber: true },
    }),
    prisma.purchaseRequest.findFirst({
      orderBy: { id: "asc" },
      select: { id: true },
    }),
    prisma.purchaseProcess.findMany({
      orderBy: { id: "asc" },
      take: 2,
      select: { id: true },
    }),
    prisma.contract.findFirst({
      orderBy: { id: "asc" },
      select: { id: true, updatedValue: true, endDate: true },
    }),
    prisma.supplier.findFirst({
      orderBy: { id: "asc" },
      select: { id: true },
    }),
    prisma.asset.findFirst({
      orderBy: { id: "asc" },
      select: { id: true, currentValue: true },
    }),
    prisma.material.findFirst({
      orderBy: { id: "asc" },
      select: { id: true },
    }),
    prisma.schoolClass.findFirst({
      where: { teacherId: { not: null } },
      orderBy: { id: "asc" },
      select: { id: true, schoolId: true, teacherId: true, stage: true, grade: true, shift: true },
    }),
  ]);

  const protocol = required(process, "processo de protocolo");
  const firstDepartment = required(departments[0], "departamento");
  const secondDepartment = departments[1] ?? firstDepartment;
  const responsible = required(employee, "servidor");
  const user = required(actor, "usuário");
  const year = required(financialYear, "exercício financeiro");
  const source = required(resourceSource, "fonte de recurso");
  const account = required(bankAccount, "conta bancária");
  const request = required(purchaseRequest, "solicitação de compra");
  const biddingProcess = required(purchaseProcesses[0], "processo de compra");
  const directProcess = purchaseProcesses[1] ?? biddingProcess;
  const procurementContract = required(contract, "contrato");
  const procurementSupplier = required(supplier, "fornecedor");
  const patrimonialAsset = required(asset, "bem patrimonial");
  const stockMaterial = required(material, "material");
  const educationClass = required(schoolClass, "turma com docente");
  const teacherId = required(educationClass.teacherId, "docente da turma");
  const classEnrollment = await prisma.enrollment.findFirst({
    where: { classId: educationClass.id },
    orderBy: { id: "asc" },
    select: { studentId: true },
  });
  const educationStudentId = required(classEnrollment, "matrícula da turma").studentId;

  const stageDepartmentId = protocol.currentDepartmentId ?? firstDepartment.id;
  const protocolStageId = operationalId("PST", `${protocol.id}:análise`);
  const protocolDocumentId = operationalId("DOC", `${protocol.id}:requerimento`);
  const documentClassId = operationalId("DCL", "requerimentos-administrativos");
  const folderId = operationalId("FOL", "protocolos-em-análise");
  const versionId = operationalId("DVR", `${protocolDocumentId}:1`);
  const documentHash = "88a4ef3ebd0856886db744238f4f73f25768c4fe0c9c67da75e2ea232d25f6d8";

  await insertOperationalRows(prisma, "processWorkflowStage", [
    {
      id: protocolStageId,
      processTypeId: protocol.processTypeId,
      subjectId: protocol.subjectId,
      departmentId: stageDepartmentId,
      position: 80,
      slaDays: 3,
      label: "Análise documental",
      isActive: true,
    },
    {
      id: operationalId("PST", `${protocol.id}:decisão`),
      processTypeId: protocol.processTypeId,
      subjectId: protocol.subjectId,
      departmentId: secondDepartment.id,
      position: 81,
      slaDays: 2,
      label: "Decisão administrativa",
      isActive: true,
    },
  ], reports);

  await insertOperationalRows(prisma, "documentClass", [
    {
      id: documentClassId,
      code: `REQ-${documentClassId.slice(-12).toUpperCase()}`,
      label: "Requerimento administrativo",
      signaturePolicy: "INTERNAL_ALLOWED",
      isActive: true,
    },
    {
      id: operationalId("DCL", "pareceres-técnicos"),
      code: `PAR-${operationalId("DCL", "pareceres-técnicos").slice(-12).toUpperCase()}`,
      label: "Parecer técnico",
      signaturePolicy: "ICP_REQUIRED",
      isActive: true,
    },
  ], reports);
  await insertOperationalRows(prisma, "folder", [
    {
      id: folderId,
      name: "Protocolos em análise",
      description: "Documentos recebidos e aguardando conferência.",
      departmentId: stageDepartmentId,
    },
    {
      id: operationalId("FOL", "pareceres-pendentes"),
      name: "Pareceres pendentes",
      description: "Minutas encaminhadas para assinatura.",
      departmentId: secondDepartment.id,
    },
  ], reports);
  await insertOperationalRows(prisma, "document", [{
    id: protocolDocumentId,
    title: "Requerimento de atualização cadastral",
    documentType: "Requerimento",
    fileUrl: `ged://protocolos/${protocol.id}/requerimento.pdf`,
    status: "Válido",
    documentClassId,
    folderId,
    publicLabel: "Documento protocolado",
    retentionMonths: 60,
    createdAt: at(2, 3, 9),
  }], reports);
  await insertOperationalRows(prisma, "documentVersion", [{
    id: versionId,
    documentId: protocolDocumentId,
    versionNumber: 1,
    fileUrl: `ged://protocolos/${protocol.id}/requerimento-v1.pdf`,
    hashSha256: documentHash,
    status: "FINAL",
    finalizedAt: at(2, 3, 9),
    publicValidationCode: operationalId("VAL", protocolDocumentId),
  }], reports);
  await insertOperationalRows(prisma, "documentSignature", [{
    id: operationalId("DSG", `${versionId}:${user.id}`),
    documentId: protocolDocumentId,
    documentVersionId: versionId,
    signerUsuarioId: user.id,
    signerEmployeeId: user.employeeId,
    signerName: user.nome,
    signerEmail: user.email,
    signatureType: "SIGN",
    provider: "INTERNAL",
    isRequired: true,
    requestedByUsuarioId: user.id,
    authenticationMethod: "SESSION_REAUTHENTICATION",
    documentHash,
    verificationCode: operationalId("VER", `${versionId}:${user.id}`),
    status: "PENDING",
    requestedAt: at(2, 3, 10),
  }], reports);
  await insertOperationalRows(prisma, "processDocument", [{
    id: operationalId("PDOC", `${protocol.id}:${protocolDocumentId}`),
    processId: protocol.id,
    documentId: protocolDocumentId,
    purpose: "Instrução inicial",
    employeeId: responsible.id,
    createdAt: at(2, 3, 9),
  }], reports);
  await insertOperationalRows(prisma, "processDispatch", [{
    id: operationalId("PDSP", `${protocol.id}:conferência`),
    processId: protocol.id,
    content: "Encaminhe-se para conferência dos dados e da documentação apresentada.",
    dispatchType: "Despacho",
    employeeId: responsible.id,
    departmentId: stageDepartmentId,
    createdAt: at(2, 3, 11),
  }], reports);
  await insertOperationalRows(prisma, "processEvent", [
    {
      id: operationalId("PEVT", `${protocol.id}:documento-recebido`),
      processId: protocol.id,
      eventType: "DOCUMENT_RECEIVED",
      description: "Requerimento incluído para conferência.",
      departmentId: stageDepartmentId,
      employeeId: responsible.id,
      metadata: JSON.stringify({ documentId: protocolDocumentId, pendingSignature: true }),
      createdAt: at(2, 3, 9),
    },
    {
      id: operationalId("PEVT", `${protocol.id}:prazo-próximo`),
      processId: protocol.id,
      eventType: "DUE_DATE_WARNING",
      description: "Prazo de análise próximo do vencimento.",
      departmentId: stageDepartmentId,
      createdAt: at(2, 6, 9),
    },
  ], reports);
  await insertOperationalRows(prisma, "protocolNotification", [{
    id: operationalId("PNOT", `${protocol.id}:${user.id}:prazo`),
    userId: user.id,
    processId: protocol.id,
    sourceModule: "PROCESSOS",
    entityType: "PROCESS",
    entityId: protocol.id,
    type: "PRAZO",
    title: "Prazo de análise próximo",
    message: "O processo aguarda conferência documental.",
    priority: "ALTA",
    dedupeKey: operationalId("DED", `${protocol.id}:prazo`),
    createdAt: at(2, 6, 9),
  }], reports);

  const revenueNatureId = operationalId("RNA", "receita-serviços-administrativos");
  const revenueId = operationalId("REV", `${account.id}:2026-02-10:1840`);
  const treasuryMovementId = operationalId("TRM", revenueId);
  const statementImportId = operationalId("BSI", `${account.id}:2026-02`);
  const statementItemMatchedId = operationalId("BSIITEM", `${statementImportId}:1`);
  const statementItemPendingId = operationalId("BSIITEM", `${statementImportId}:2`);
  const debitAccountId = operationalId("ACP", "bancos-movimento");
  const creditAccountId = operationalId("ACP", "receita-arrecadada");
  const accountingTransactionId = operationalId("ACT", revenueId);

  await insertOperationalRows(prisma, "revenueNature", [{
    id: revenueNatureId,
    code: `REC-${revenueNatureId.slice(-12).toUpperCase()}`,
    name: "Serviços administrativos",
  }], reports);
  await insertOperationalRows(prisma, "revenue", [{
    id: revenueId,
    date: at(2, 10),
    value: 1840,
    valueDecimal: 1840,
    financialYearId: year.id,
    revenueNatureId,
    resourceSourceId: source.id,
    bankAccountId: account.id,
    status: "Arrecadada",
    stage: "ARRECADADA",
    classification: "ORCAMENTARIA",
    launchDate: at(2, 10),
    collectionDate: at(2, 10),
    history: "Arrecadação de serviços administrativos.",
    sourceModule: "TESOURARIA",
    sourceType: "BANK_STATEMENT",
    sourceId: statementItemMatchedId,
    eventType: "REVENUE_CONFIRMED",
    idempotencyKey: operationalId("IDEM", revenueId),
    collectionReference: "GUIA-2026-0210-01",
  }], reports);
  await insertOperationalRows(prisma, "treasuryMovement", [{
    id: treasuryMovementId,
    date: at(2, 10),
    type: "Arrecadação",
    direction: "Entrada",
    valueDecimal: 1840,
    history: "Crédito identificado no extrato bancário.",
    status: "Confirmado",
    bankAccountId: account.id,
    financialYearId: year.id,
    revenueId,
    sourceModule: "RECEITA",
    sourceType: "REVENUE",
    sourceId: revenueId,
    eventType: "REVENUE_COLLECTION",
    idempotencyKey: operationalId("IDEM", treasuryMovementId),
  }], reports);
  await insertOperationalRows(prisma, "bankStatementImport", [{
    id: statementImportId,
    bankAccountId: account.id,
    format: "OFX",
    fileName: "extrato-fevereiro-2026.ofx",
    checksum: "e0d76ed71ef89c8a45c864769354b458e09896541f33f427fda0b95beae219c9",
    status: "Importado",
    importedAt: at(3, 1, 8),
  }], reports);
  await insertOperationalRows(prisma, "bankStatementItem", [
    {
      id: statementItemMatchedId,
      bankAccountId: account.id,
      statementImportId,
      date: at(2, 10),
      description: "Crédito de arrecadação municipal",
      reference: "GUIA-2026-0210-01",
      direction: "CREDITO",
      valueDecimal: 1840,
      status: "Conciliado",
      treasuryMovementId,
    },
    {
      id: statementItemPendingId,
      bankAccountId: account.id,
      statementImportId,
      date: at(2, 18),
      description: "Tarifa bancária sem classificação",
      reference: "TAR-0218",
      direction: "DEBITO",
      valueDecimal: 38.5,
      status: "Pendente",
    },
  ], reports);
  await insertOperationalRows(prisma, "bankReconciliation", [{
    id: operationalId("BRC", `${account.id}:2026-02`),
    date: at(3, 1),
    periodStart: at(2, 1, 0),
    periodEnd: at(2, 28, 23),
    bankAccountId: account.id,
    systemBalance: 1840,
    systemBalanceDecimal: 1840,
    bankBalance: 1801.5,
    bankBalanceDecimal: 1801.5,
    status: "Divergente",
  }], reports);
  await insertOperationalRows(prisma, "accountingPlan", [
    { id: debitAccountId, code: `ATV-${debitAccountId.slice(-12).toUpperCase()}`, name: "Bancos conta movimento", type: "Ativo" },
    { id: creditAccountId, code: `REC-${creditAccountId.slice(-12).toUpperCase()}`, name: "Receita arrecadada", type: "Receita" },
  ], reports);
  await insertOperationalRows(prisma, "accountingTransaction", [{
    id: accountingTransactionId,
    financialYearId: year.id,
    date: at(2, 10),
    history: "Reconhecimento da receita arrecadada.",
    status: "POSTADO",
    sourceModule: "RECEITA",
    sourceType: "REVENUE",
    sourceId: revenueId,
    eventType: "REVENUE_COLLECTION",
    idempotencyKey: operationalId("IDEM", accountingTransactionId),
    authorUsuarioId: user.id,
    authorEmployeeId: user.employeeId,
    postedAt: at(2, 10, 14),
  }], reports);
  await insertOperationalRows(prisma, "accountingEntry", [
    {
      id: operationalId("ACE", `${accountingTransactionId}:débito`),
      date: at(2, 10),
      value: 1840,
      valueDecimal: 1840,
      type: "Débito",
      history: "Entrada em conta bancária.",
      accountId: debitAccountId,
      authorId: responsible.id,
      transactionId: accountingTransactionId,
    },
    {
      id: operationalId("ACE", `${accountingTransactionId}:crédito`),
      date: at(2, 10),
      value: 1840,
      valueDecimal: 1840,
      type: "Crédito",
      history: "Receita de serviços administrativos.",
      accountId: creditAccountId,
      authorId: responsible.id,
      transactionId: accountingTransactionId,
    },
  ], reports);

  await insertOperationalRows(prisma, "purchasePlanning", [{
    id: operationalId("PPL", `${request.id}:2026`),
    description: "Aquisição prevista para reposição do almoxarifado.",
    originPurchaseRequestId: request.id,
    unit: "UN",
    quantity: 40,
    expectedPeriodStart: at(4, 1, 0),
    expectedPeriodEnd: at(6, 30, 0),
    estimatedValueDecimal: 12600,
    status: "Em análise",
  }], reports);
  await insertOperationalRows(prisma, "preliminaryTechnicalStudy", [{
    id: operationalId("ETP", biddingProcess.id),
    description: "Avaliação de alternativas para atendimento continuado das unidades.",
    justification: "Há consumo recorrente e necessidade de padronização da contratação.",
    estimatedValue: 12600,
    status: "Aprovado",
    processId: biddingProcess.id,
  }], reports);
  await insertOperationalRows(prisma, "termOfReference", [{
    id: operationalId("TR", biddingProcess.id),
    object: "Fornecimento parcelado de materiais de expediente.",
    justification: "Reposição programada para as unidades administrativas.",
    scope: "Entrega mensal conforme ordens de fornecimento.",
    estimatedValue: 12600,
    status: "Em Elaboração",
    processId: biddingProcess.id,
  }], reports);
  await insertOperationalRows(prisma, "bidding", [{
    id: operationalId("BID", biddingProcess.id),
    number: `PE-${operationalId("N", biddingProcess.id).slice(-8).toUpperCase()}`,
    modality: "Pregão eletrônico",
    status: "Aguardando publicação",
    publicationDate: at(3, 16),
    sessionDate: at(3, 30),
    processId: biddingProcess.id,
  }], reports);
  await insertOperationalRows(prisma, "directContracting", [{
    id: operationalId("DIR", directProcess.id),
    type: "Dispensa",
    justification: "Aquisição de baixo valor para atendimento de necessidade imediata.",
    value: 2850,
    status: "Em análise jurídica",
    processId: directProcess.id,
    supplierId: procurementSupplier.id,
  }], reports);
  await insertOperationalRows(prisma, "contractAmendment", [{
    id: operationalId("AMD", `${procurementContract.id}:prazo-1`),
    type: "Prazo",
    justification: "Prorrogação necessária para concluir as entregas previstas.",
    previousValue: procurementContract.updatedValue,
    newValue: procurementContract.updatedValue,
    previousEndDate: procurementContract.endDate,
    newEndDate: new Date(procurementContract.endDate.getTime() + 90 * 86_400_000),
    status: "Minuta",
    contractId: procurementContract.id,
  }], reports);

  const benefitConfigId = operationalId("BEN", "auxílio-alimentação");
  await insertOperationalRows(prisma, "leave", [{
    id: operationalId("LEV", `${responsible.id}:2026-03-09`),
    employeeId: responsible.id,
    type: "Licença médica",
    startDate: at(3, 9, 0),
    endDate: at(3, 11, 23),
    reason: "Afastamento de curta duração.",
    status: "Aguardando homologação",
  }], reports);
  await insertOperationalRows(prisma, "vacation", [{
    id: operationalId("VAC", `${responsible.id}:2025-2026`),
    employeeId: responsible.id,
    acquisitionStart: new Date(Date.UTC(2025, 0, 2)),
    acquisitionEnd: new Date(Date.UTC(2026, 0, 1)),
    enjoymentStart: at(7, 6, 0),
    enjoymentEnd: at(7, 25, 23),
    days: 20,
    status: "Programada",
  }], reports);
  await insertOperationalRows(prisma, "attendanceRecord", [
    {
      id: operationalId("ATT", `${responsible.id}:2026-03-05`),
      employeeId: responsible.id,
      date: at(3, 5, 0),
      entryTime: at(3, 5, 8),
      exitTime: at(3, 5, 17),
      status: "Presente",
      hoursWorked: 8,
      contractedHours: 8,
    },
    {
      id: operationalId("ATT", `${responsible.id}:2026-03-06`),
      employeeId: responsible.id,
      date: at(3, 6, 0),
      entryTime: at(3, 6, 9),
      exitTime: at(3, 6, 17),
      status: "Atraso",
      hoursWorked: 7,
      bankHours: -1,
      contractedHours: 8,
    },
  ], reports);
  await insertOperationalRows(prisma, "dependent", [{
    id: operationalId("DEPEN", `${responsible.id}:ana`),
    employeeId: responsible.id,
    name: "Ana Martins",
    birthDate: new Date(Date.UTC(2014, 7, 14)),
    relationship: "Filha",
    irrfDependent: true,
    familyWage: false,
  }], reports);
  await insertOperationalRows(prisma, "benefitConfig", [{
    id: benefitConfigId,
    name: "Auxílio-alimentação",
    type: "Auxílio Alimentação",
    baseValue: 520,
    isActive: true,
  }], reports);
  await insertOperationalRows(prisma, "payrollBenefit", [{
    id: operationalId("PBEN", `${responsible.id}:${benefitConfigId}`),
    employeeId: responsible.id,
    benefitConfigId,
    status: "Ativo",
  }], reports);
  await insertOperationalRows(prisma, "personnelAct", [{
    id: operationalId("PACT", `${responsible.id}:férias-2026`),
    employeeId: responsible.id,
    type: "Férias",
    actNumber: "PORT-042/2026",
    date: at(3, 2),
    documentUrl: "ged://atos-pessoal/portaria-042-2026.pdf",
  }], reports);

  const costCenterId = operationalId("CCT", "almoxarifado-administrativo");
  const warehouseId = operationalId("WHS", "almoxarifado-administrativo");
  const stockId = operationalId("MST", `${warehouseId}:${stockMaterial.id}`);
  const inventorySessionId = operationalId("INV", `${warehouseId}:2026-03`);
  await insertOperationalRows(prisma, "costCenter", [{
    id: costCenterId,
    code: `CC-${costCenterId.slice(-12).toUpperCase()}`,
    name: "Almoxarifado administrativo",
    description: "Centro de custos dos materiais de consumo administrativo.",
    isActive: true,
  }], reports);
  await insertOperationalRows(prisma, "warehouse", [{
    id: warehouseId,
    name: "Almoxarifado administrativo",
    type: "Setorial",
    address: "Paço Municipal, bloco de apoio",
    isActive: true,
    managerId: responsible.id,
    costCenterId,
  }], reports);
  await insertOperationalRows(prisma, "materialStock", [{
    id: stockId,
    quantity: 24,
    batchNumber: "LOTE-2026-03",
    unitCost: 18.75,
    warehouseId,
    materialId: stockMaterial.id,
  }], reports);
  await insertOperationalRows(prisma, "assetValueHistory", [{
    id: operationalId("AVH", `${patrimonialAsset.id}:2026-02`),
    assetId: patrimonialAsset.id,
    referenceMonth: at(2, 1, 0),
    openingValue: patrimonialAsset.currentValue,
    depreciation: Math.round(patrimonialAsset.currentValue * 0.01 * 100) / 100,
    closingValue: Math.round(patrimonialAsset.currentValue * 0.99 * 100) / 100,
    lifeSpanMonths: 60,
  }], reports);
  await insertOperationalRows(prisma, "assetValueAdjustment", [{
    id: operationalId("AVA", `${patrimonialAsset.id}:avaliação-2026`),
    type: "IMPAIRMENT",
    date: at(3, 12),
    openingValue: patrimonialAsset.currentValue,
    adjustmentValue: -Math.round(patrimonialAsset.currentValue * 0.08 * 100) / 100,
    closingValue: Math.round(patrimonialAsset.currentValue * 0.92 * 100) / 100,
    justification: "Desgaste acima do previsto identificado em vistoria.",
    evidence: "Laudo de avaliação patrimonial 017/2026",
    assetId: patrimonialAsset.id,
  }], reports);
  await insertOperationalRows(prisma, "inventorySession", [{
    id: inventorySessionId,
    status: "PENDING_APPROVAL",
    lockMovements: true,
    startedAt: at(3, 20, 8),
    submittedAt: at(3, 20, 16),
    approvalEvidence: "Contagem acompanhada pelo responsável do almoxarifado.",
    warehouseId,
    createdByUsuarioId: user.id,
  }], reports);
  await insertOperationalRows(prisma, "inventorySessionItem", [{
    id: operationalId("INI", `${inventorySessionId}:${stockId}`),
    expectedQuantity: 24,
    countedQuantity: 22,
    divergenceType: "FALTA",
    countEvidence: "Folha de contagem 03/2026",
    adjustmentReason: "Divergência aguardando validação.",
    countedAt: at(3, 20, 15),
    sessionId: inventorySessionId,
    stockId,
  }], reports);

  const subjectId = operationalId("SSUB", "matemática");
  const diaryId = operationalId("CDRY", `${educationClass.id}:2026-03-04`);
  await insertOperationalRows(prisma, "schoolSubject", [
    {
      id: subjectId,
      name: "Matemática",
      code: `MAT-${subjectId.slice(-12).toUpperCase()}`,
      description: "Componente curricular do ensino fundamental.",
      isActive: true,
    },
    {
      id: operationalId("SSUB", "língua-portuguesa"),
      name: "Língua Portuguesa",
      code: `LP-${operationalId("SSUB", "língua-portuguesa").slice(-12).toUpperCase()}`,
      description: "Leitura, produção textual e análise linguística.",
      isActive: true,
    },
  ], reports);
  await insertOperationalRows(prisma, "preEnrollment", [{
    id: operationalId("PRE", `${educationStudentId}:${educationClass.schoolId}:2027`),
    year: 2027,
    stage: educationClass.stage,
    grade: educationClass.grade,
    shift: educationClass.shift,
    status: "Pendente",
    studentId: educationStudentId,
    schoolId: educationClass.schoolId,
  }], reports);
  await insertOperationalRows(prisma, "classDiary", [{
    id: diaryId,
    date: at(3, 4, 8),
    contentTaught: "Resolução de problemas com as quatro operações.",
    observations: "Atividade de revisão antes da avaliação bimestral.",
    status: "Aberto",
    classId: educationClass.id,
    subjectId,
    teacherId,
  }], reports);
  await insertOperationalRows(prisma, "attendance", [{
    id: operationalId("SATT", `${diaryId}:${educationStudentId}`),
    isPresent: false,
    justification: "Justificativa ainda não apresentada.",
    diaryId,
    studentId: educationStudentId,
  }], reports);
  await insertOperationalRows(prisma, "grade", [{
    id: operationalId("GRD", `${educationStudentId}:${subjectId}:1`),
    period: "1º Bimestre",
    value: 6.5,
    type: "Avaliação",
    studentId: educationStudentId,
    subjectId,
    teacherId,
  }], reports);
  await insertOperationalRows(prisma, "schoolBus", [{
    id: operationalId("SBUS", "rota-rural-norte"),
    code: `ESC-${operationalId("SBUS", "rota-rural-norte").slice(-12).toUpperCase()}`,
    capacity: 44,
    value: 318000,
    maintenanceDate: at(4, 15),
    status: "Ativo",
  }], reports);
  await insertOperationalRows(prisma, "schoolCalendarEvent", [
    {
      id: operationalId("SCAL", "início-segundo-semestre-2026"),
      title: "Início do segundo semestre",
      date: at(7, 27, 7),
      type: "Início de Semestre",
    },
    {
      id: operationalId("SCAL", "conselho-classe-2026-1"),
      title: "Conselho de classe",
      date: at(4, 24, 13),
      endDate: at(4, 24, 17),
      type: "Atividade Pedagógica",
    },
  ], reports);
}
