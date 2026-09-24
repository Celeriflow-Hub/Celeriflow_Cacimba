import type { PrismaClient } from "@prisma/client";
import {
  insertOperationalRows,
  operationalId,
  type OperationalSeedReport,
} from "./operational-seed-utils";

export async function seedOperationalServices(
  prisma: PrismaClient,
  reports: OperationalSeedReport[],
) {
  const [
    secretariat,
    department,
    employee,
    people,
    companies,
    neighborhood,
    healthUnit,
    healthProfessional,
    patient,
    socialFamily,
    socialUnit,
    fleetUnit,
    integrationConnection,
  ] = await Promise.all([
    prisma.secretariat.findFirst({ orderBy: { id: "asc" }, select: { id: true } }),
    prisma.department.findFirst({ orderBy: { id: "asc" }, select: { id: true, secretariatId: true } }),
    prisma.employee.findFirst({ orderBy: { id: "asc" }, select: { id: true } }),
    prisma.person.findMany({ orderBy: { id: "asc" }, take: 2, select: { id: true } }),
    prisma.company.findMany({ orderBy: { id: "asc" }, select: { id: true } }),
    prisma.neighborhood.findFirst({ orderBy: { id: "asc" }, select: { id: true } }),
    prisma.healthUnit.findFirst({ orderBy: { id: "asc" }, select: { id: true } }),
    prisma.healthProfessional.findFirst({
      orderBy: { id: "asc" },
      select: { id: true, employeeId: true, unitId: true },
    }),
    prisma.patient.findFirst({ orderBy: { id: "asc" }, select: { id: true } }),
    prisma.socialFamily.findFirst({
      orderBy: { id: "asc" },
      select: { id: true, representativeId: true },
    }),
    prisma.socialUnit.findFirst({ orderBy: { id: "asc" }, select: { id: true } }),
    prisma.fleetUnit.findFirst({
      orderBy: { id: "asc" },
      select: { id: true, createdById: true },
    }),
    prisma.integrationConnection.findFirst({
      orderBy: { id: "asc" },
      select: { id: true, environment: true },
    }),
  ]);

  const missing = [
    !secretariat && "secretaria",
    !department && "departamento",
    !employee && "servidor",
    people.length < 2 && "duas pessoas",
    companies.length < 1 && "empresa",
    !healthUnit && "unidade de saúde",
    !healthProfessional && "profissional de saúde",
    !patient && "paciente",
    !socialFamily && "família social",
    !socialUnit && "unidade social",
    !fleetUnit && "unidade de frota",
    !integrationConnection && "conexão de integração",
  ].filter((item): item is string => Boolean(item));

  if (missing.length) {
    throw new Error(`Seed operacional requer dados importados: ${missing.join(", ")}.`);
  }

  const selectedSecretariat = secretariat!;
  const selectedDepartment = department!;
  const selectedEmployee = employee!;
  const representative = people[0];
  const representedPerson = people[1];
  const representedCompany = companies[0];
  const selectedHealthProfessional = healthProfessional!;
  const selectedHealthUnitId = selectedHealthProfessional.unitId ?? healthUnit!.id;
  const selectedPatient = patient!;
  const selectedSocialFamily = socialFamily!;
  const selectedSocialUnit = socialUnit!;
  const selectedFleetUnit = fleetUnit!;
  const selectedConnection = integrationConnection!;
  const date = (value: string) => new Date(`${value}T12:00:00.000Z`);
  const id = (prefix: string, value: string) => operationalId(prefix, `operational-services:${value}`);

  await insertOperationalRows(prisma, "institution", [{
    id: id("INST", "municipality"),
    name: "Prefeitura Municipal de Divino",
    legalName: "Município de Divino",
    cnpj: "18.114.272/0001-88",
    address: "Praça Doutor Genserico Nunes de Oliveira, 1",
    city: "Divino",
    state: "MG",
    zipCode: "36820-000",
    phone: "(32) 3743-1120",
    email: "atendimento@divino.mg.gov.br",
  }], reports);

  await insertOperationalRows(prisma, "reportTemplate", [{
    id: id("RPT", "global"),
    scope: "GLOBAL",
    version: 1,
    fingerprint: id("RPT-FP", "global-v1"),
    header: "Prefeitura Municipal de Divino",
    footer: "Documento emitido pelo sistema de gestão municipal",
    orientation: "LANDSCAPE",
    includeEmissionMetadata: true,
  }], reports);

  await insertOperationalRows(prisma, "internalDemand", [{
    id: id("DEM", "review-service-hours"),
    title: "Revisar horários de atendimento ao público",
    description: "Consolidar os horários das unidades para atualização dos canais de atendimento.",
    status: "Em andamento",
    priority: "Normal",
    deadline: date("2026-10-02"),
    secretariatId: selectedDepartment.secretariatId || selectedSecretariat.id,
    departmentId: selectedDepartment.id,
    assigneeId: selectedEmployee.id,
    creatorId: selectedEmployee.id,
    createdAt: date("2026-09-14"),
  }], reports);

  await insertOperationalRows(prisma, "calendarEvent", [
    {
      id: id("CAL", "municipal-anniversary-2026"),
      title: "Aniversário do município",
      description: "Feriado municipal.",
      date: date("2026-01-25"),
      isHoliday: true,
      type: "Feriado Municipal",
    },
    {
      id: id("CAL", "public-service-planning-2026"),
      title: "Planejamento integrado dos serviços públicos",
      description: "Reunião de alinhamento entre as unidades municipais.",
      date: date("2026-10-07"),
      isHoliday: false,
      type: "Agenda Institucional",
    },
  ], reports);

  await insertOperationalRows(prisma, "taxpayer", [
    {
      id: id("TAXP", `person:${representedPerson.id}`),
      taxpayerType: "PF",
      municipalInsc: id("IM-PF", representedPerson.id),
      status: "Ativo",
      economicActivities: "Prestação de serviços autônomos",
      personId: representedPerson.id,
    },
    {
      id: id("TAXP", `company:${representedCompany.id}`),
      taxpayerType: "PJ",
      municipalInsc: id("IM-PJ", representedCompany.id),
      status: "Ativo",
      economicActivities: "Comércio e fornecimento de materiais",
      companyId: representedCompany.id,
    },
  ], reports);

  await insertOperationalRows(prisma, "address", companies.map((company, index) => ({
    id: id("ADDR-COMP", company.id),
    zipCode: index === 0 ? "36820-000" : "36820-970",
    streetName: index === 0 ? "Rua Presidente Vargas" : "Avenida Governador Valadares",
    number: index === 0 ? "245" : "780",
    complement: index === 0 ? "Sala 2" : null,
    addressType: "Comercial",
    zone: "Urbana",
    neighborhoodId: neighborhood?.id ?? null,
    companyId: company.id,
  })), reports);

  await insertOperationalRows(prisma, "legalRepresentative", [{
    id: id("LEGAL", `${representative.id}:${representedCompany.id}`),
    representationType: "Sócio-administrador",
    startDate: date("2024-01-08"),
    grantedPowers: "Representação administrativa e fiscal",
    status: "Ativo",
    representedCompanyId: representedCompany.id,
    representativeId: representative.id,
  }], reports);

  const cboId = id("HCBO", "225125");
  const specialtyId = id("HSP", "clinical-medicine");
  const specialtyGroupId = id("HSG", "primary-care");
  const consultationServiceId = id("HSV", "medical-consultation");
  const procedureServiceId = id("HSV", "blood-pressure-monitoring");

  await insertOperationalRows(prisma, "healthCbo", [{
    id: cboId,
    code: "225125",
    description: "Médico clínico",
    isActive: true,
  }], reports);
  await insertOperationalRows(prisma, "healthSpecialty", [{
    id: specialtyId,
    code: "CLINICA_MEDICA",
    name: "Clínica médica",
    isActive: true,
  }], reports);
  await insertOperationalRows(prisma, "healthSpecialtyGroup", [{
    id: specialtyGroupId,
    name: "Atenção primária",
    isActive: true,
  }], reports);
  await insertOperationalRows(prisma, "healthService", [
    {
      id: consultationServiceId,
      code: "CONSULTA_CLINICA",
      name: "Consulta médica em atenção primária",
      classification: "Consulta",
      isActive: true,
    },
    {
      id: procedureServiceId,
      code: "AFERICAO_PRESSAO",
      name: "Aferição de pressão arterial",
      classification: "Procedimento",
      isActive: true,
    },
  ], reports);
  await insertOperationalRows(prisma, "healthSpecialtyGroupMember", [{
    id: id("HSGM", `${specialtyGroupId}:${specialtyId}`),
    groupId: specialtyGroupId,
    specialtyId,
  }], reports);
  await insertOperationalRows(prisma, "healthSpecialtyGroupService", [
    {
      id: id("HSGS", `${specialtyGroupId}:${consultationServiceId}`),
      groupId: specialtyGroupId,
      serviceId: consultationServiceId,
    },
    {
      id: id("HSGS", `${specialtyGroupId}:${procedureServiceId}`),
      groupId: specialtyGroupId,
      serviceId: procedureServiceId,
    },
  ], reports);
  await insertOperationalRows(prisma, "healthUnitShift", [1, 2, 3, 4, 5].map((dayOfWeek) => ({
    id: id("HSHIFT", `${selectedHealthUnitId}:${dayOfWeek}:0700`),
    unitId: selectedHealthUnitId,
    dayOfWeek,
    startTime: "07:00",
    endTime: "16:00",
    isActive: true,
  })), reports);
  await insertOperationalRows(prisma, "healthUnitSpecialty", [{
    id: id("HUNITSP", `${selectedHealthUnitId}:${specialtyId}`),
    unitId: selectedHealthUnitId,
    specialtyId,
    isActive: true,
  }], reports);
  await insertOperationalRows(prisma, "healthProfessionalAssignment", [{
    id: id("HPROASG", `${selectedHealthProfessional.id}:${selectedHealthUnitId}:${specialtyId}`),
    professionalId: selectedHealthProfessional.id,
    unitId: selectedHealthUnitId,
    specialtyId,
    weeklyHours: 20,
    isActive: true,
  }], reports);
  await insertOperationalRows(prisma, "healthServiceAssignment", [
    {
      id: id("HSVASG", `${consultationServiceId}:professional:${selectedHealthProfessional.id}`),
      serviceId: consultationServiceId,
      unitId: null,
      professionalId: selectedHealthProfessional.id,
      isActive: true,
    },
    {
      id: id("HSVASG", `${procedureServiceId}:unit:${selectedHealthUnitId}`),
      serviceId: procedureServiceId,
      unitId: selectedHealthUnitId,
      professionalId: null,
      isActive: true,
    },
  ], reports);
  await insertOperationalRows(prisma, "healthHabilitation", [
    {
      id: id("HHAB", `unit:${selectedHealthUnitId}:primary-care`),
      code: "ATENCAO_PRIMARIA",
      description: "Atendimento ambulatorial de atenção primária",
      unitId: selectedHealthUnitId,
      professionalId: null,
      isActive: true,
    },
    {
      id: id("HHAB", `professional:${selectedHealthProfessional.id}:clinical-care`),
      code: "ATENDIMENTO_CLINICO",
      description: "Atendimento clínico de adultos",
      unitId: null,
      professionalId: selectedHealthProfessional.id,
      isActive: true,
    },
  ], reports);
  await insertOperationalRows(prisma, "healthSchedulingGroup", [{
    id: id("HSCHED", `${selectedHealthUnitId}:${specialtyGroupId}`),
    name: "Consultas de atenção primária",
    unitId: selectedHealthUnitId,
    specialtyGroupId,
    isActive: true,
  }], reports);
  await insertOperationalRows(prisma, "healthRegistrationStatusHistory", [
    {
      id: id("HSTATUS", `unit:${selectedHealthUnitId}:active`),
      unitId: selectedHealthUnitId,
      professionalId: null,
      isActive: true,
      reason: "Cadastro conferido e ativo",
      occurredAt: date("2026-09-01"),
    },
    {
      id: id("HSTATUS", `professional:${selectedHealthProfessional.id}:active`),
      unitId: null,
      professionalId: selectedHealthProfessional.id,
      isActive: true,
      reason: "Vínculo profissional conferido",
      occurredAt: date("2026-09-01"),
    },
  ], reports);

  const appointmentId = id("HAPPT", `${selectedPatient.id}:2026-09-08`);
  const medicineId = id("MED", "paracetamol-500mg");
  const medicineBatchId = id("MEDB", "paracetamol-500mg:PC26081");
  const vaccineId = id("VAC", "influenza-2026");

  await insertOperationalRows(prisma, "healthAppointment", [{
    id: appointmentId,
    date: new Date("2026-09-08T13:30:00.000Z"),
    specialty: "Clínica médica",
    priority: "Normal",
    status: "Atendido",
    patientId: selectedPatient.id,
    unitId: selectedHealthUnitId,
    professionalId: selectedHealthProfessional.id,
  }], reports);
  await insertOperationalRows(prisma, "medicalRecord", [{
    id: id("MREC", appointmentId),
    date: new Date("2026-09-08T13:35:00.000Z"),
    type: "Consulta",
    bloodPressure: "128/82",
    temperature: 37.4,
    weight: 71.8,
    height: 1.68,
    heartRate: 78,
    chiefComplaint: "Cefaleia leve e mal-estar desde o dia anterior.",
    evolution: "Sem sinais de alarme, exame físico geral sem alterações relevantes.",
    conduct: "Hidratação, repouso e analgésico se necessário; retorno em caso de piora.",
    patientId: selectedPatient.id,
    professionalId: selectedHealthProfessional.id,
    unitId: selectedHealthUnitId,
    appointmentId,
  }], reports);
  await insertOperationalRows(prisma, "medicine", [{
    id: medicineId,
    name: "Paracetamol",
    activePrinciple: "Paracetamol",
    presentation: "Comprimido",
    concentration: "500 mg",
    isControlled: false,
    currentStock: 72,
    minStock: 20,
    isActive: true,
  }], reports);
  await insertOperationalRows(prisma, "medicineBatch", [{
    id: medicineBatchId,
    batchNumber: "PC26081",
    expirationDate: date("2027-08-31"),
    quantity: 72,
    medicineId,
  }], reports);
  await insertOperationalRows(prisma, "healthPrescription", [{
    id: id("HPRES", appointmentId),
    date: date("2026-09-08"),
    content: "Paracetamol 500 mg: tomar 1 comprimido a cada 8 horas, se houver dor, por até 3 dias.",
    validUntil: date("2026-09-18"),
    patientId: selectedPatient.id,
    professionalId: selectedHealthProfessional.id,
  }], reports);
  await insertOperationalRows(prisma, "medicineDispensation", [{
    id: id("MDISP", `${appointmentId}:${medicineBatchId}`),
    date: date("2026-09-08"),
    quantity: 8,
    medicineId,
    patientId: selectedPatient.id,
    unitId: selectedHealthUnitId,
    batchId: medicineBatchId,
  }], reports);
  await insertOperationalRows(prisma, "healthExamRequest", [{
    id: id("HEXAM", appointmentId),
    date: date("2026-09-08"),
    examName: "Hemograma completo",
    reason: "Investigação de mal-estar persistente.",
    status: "Solicitado",
    patientId: selectedPatient.id,
    professionalId: selectedHealthProfessional.id,
  }], reports);
  await insertOperationalRows(prisma, "healthReferral", [{
    id: id("HREF", appointmentId),
    date: date("2026-09-08"),
    specialty: "Oftalmologia",
    reason: "Avaliação de acuidade visual associada a episódios recorrentes de cefaleia.",
    status: "Pendente",
    patientId: selectedPatient.id,
    professionalId: selectedHealthProfessional.id,
  }], reports);
  await insertOperationalRows(prisma, "vaccine", [{
    id: vaccineId,
    name: "Influenza trivalente 2026",
    disease: "Influenza",
    dosesRequired: 1,
    isActive: true,
  }], reports);
  await insertOperationalRows(prisma, "vaccinationRecord", [{
    id: id("VREC", `${selectedPatient.id}:influenza-2026`),
    date: date("2026-04-22"),
    doseNumber: 1,
    lotNumber: "IN26042",
    manufacturer: "Instituto Butantan",
    vaccineId,
    patientId: selectedPatient.id,
    professionalId: selectedHealthProfessional.id,
    unitId: selectedHealthUnitId,
  }], reports);

  await insertOperationalRows(prisma, "socialFamilyMember", [{
    id: id("SFM", `${selectedSocialFamily.id}:${selectedSocialFamily.representativeId}`),
    kinship: "Responsável familiar",
    isDependent: false,
    familyId: selectedSocialFamily.id,
    personId: selectedSocialFamily.representativeId,
  }], reports);
  await insertOperationalRows(prisma, "socialRecord", [{
    id: id("SREC", `${selectedSocialFamily.id}:2026-09`),
    history: "Família acompanhada pela rede socioassistencial, com orientação para atualização cadastral e acesso a serviços locais.",
    secrecyLevel: "Restrito",
    familyId: selectedSocialFamily.id,
    unitId: selectedSocialUnit.id,
    createdAt: date("2026-09-03"),
  }], reports);
  await insertOperationalRows(prisma, "socialVisit", [{
    id: id("SVIS", `${selectedSocialFamily.id}:2026-09-10`),
    scheduledDate: date("2026-09-10"),
    realizedDate: date("2026-09-10"),
    objective: "Verificar condições de moradia e orientar sobre a documentação cadastral.",
    report: "Visita realizada; documentação conferida e retorno acordado para acompanhamento.",
    status: "Realizada",
    familyId: selectedSocialFamily.id,
    professionalId: selectedHealthProfessional.employeeId,
  }], reports);

  const benefitId = id("SBEN", "food-support");
  const programId = id("SPROG", "family-follow-up");
  await insertOperationalRows(prisma, "socialBenefit", [{
    id: benefitId,
    name: "Auxílio alimentação eventual",
    description: "Apoio temporário destinado a famílias em situação de insegurança alimentar.",
    isRecurrent: false,
    isActive: true,
  }], reports);
  await insertOperationalRows(prisma, "socialBenefitConcession", [{
    id: id("SBCON", `${selectedSocialFamily.id}:food-support:2026-09`),
    date: date("2026-09-11"),
    quantity: 1,
    value: 180,
    status: "Entregue",
    benefitId,
    familyId: selectedSocialFamily.id,
    personId: selectedSocialFamily.representativeId,
    professionalId: selectedHealthProfessional.employeeId,
  }], reports);
  await insertOperationalRows(prisma, "socialProgram", [{
    id: programId,
    name: "Acompanhamento familiar municipal",
    description: "Acompanhamento periódico para fortalecimento de vínculos e acesso a direitos.",
    sphere: "Municipal",
    isActive: true,
  }], reports);
  await insertOperationalRows(prisma, "socialProgramParticipation", [{
    id: id("SPART", `${selectedSocialFamily.id}:${programId}`),
    entryDate: date("2026-09-03"),
    status: "Ativo",
    programId,
    familyId: selectedSocialFamily.id,
  }], reports);

  const fleetPlanId = id("FPLAN", `${selectedFleetUnit.id}:preventive-180d`);
  const fleetOrderId = id("FWO", `${fleetPlanId}:2026-10-15`);
  await insertOperationalRows(prisma, "fleetPlan", [{
    id: fleetPlanId,
    unitId: selectedFleetUnit.id,
    title: "Revisão preventiva semestral",
    type: "PREVENTIVA",
    services: "Troca de óleo, inspeção dos freios, pneus, iluminação e níveis de fluidos.",
    firstDueAt: date("2026-10-15"),
    nextDueAt: date("2026-10-15"),
    intervalDays: 180,
    estimatedCost: 850,
    active: true,
    createdById: selectedFleetUnit.createdById,
  }], reports);
  await insertOperationalRows(prisma, "fleetWorkOrder", [{
    id: fleetOrderId,
    unitId: selectedFleetUnit.id,
    planId: fleetPlanId,
    scheduledAt: date("2026-10-15"),
    title: "Revisão preventiva programada",
    type: "PREVENTIVA",
    services: "Executar os itens previstos no plano semestral.",
    intervalDays: 180,
    estimatedCost: 850,
    status: "EMITIDA",
    createdById: selectedFleetUnit.createdById,
  }], reports);
  await insertOperationalRows(prisma, "fleetDocument", [{
    id: id("FDOC", `${selectedFleetUnit.id}:crlv-2026`),
    unitId: selectedFleetUnit.id,
    kind: "OBRIGACAO",
    type: "LICENCIAMENTO",
    reference: "2026",
    title: "Certificado de Registro e Licenciamento de Veículo",
    startsAt: date("2026-01-01"),
    scheduledAt: date("2026-11-16"),
    dueAt: date("2026-11-30"),
    status: "PENDENTE",
    value: 168.44,
    notes: "Renovação anual acompanhada pela gestão da frota.",
    createdById: selectedFleetUnit.createdById,
  }], reports);
  await insertOperationalRows(prisma, "fleetOccurrence", [{
    id: id("FOCC", `${selectedFleetUnit.id}:2026-08-19:tire`),
    unitId: selectedFleetUnit.id,
    type: "OUTRO",
    occurredAt: date("2026-08-19"),
    description: "Pneu dianteiro danificado durante deslocamento; substituído pelo estepe sem interrupção do serviço.",
    involvedValue: 0,
    reference: "Registro de bordo 2026-08-19",
    createdById: selectedFleetUnit.createdById,
  }], reports);

  await insertOperationalRows(prisma, "integrationRun", [{
    id: id("IRUN", `${selectedConnection.id}:2026-09-15:status-check`),
    connectionId: selectedConnection.id,
    operation: "HEALTH_CHECK",
    environment: selectedConnection.environment,
    status: "SUCESSO",
    message: "Conectividade verificada e serviço remoto disponível.",
    externalId: "CONN-20260915-001",
    payload: { latencyMs: 184, httpStatus: 200 },
    createdAt: new Date("2026-09-15T14:20:00.000Z"),
  }], reports);
}
