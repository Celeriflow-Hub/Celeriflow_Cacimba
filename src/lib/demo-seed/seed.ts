import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import {
  activeStatus,
  dateValue,
  numberValue,
  optionalDateValue,
  requireTable,
  text,
  type DemoRow,
  type ExcelDemoSource,
} from "./excel-source";
import { normalizeOperationalLabel } from "./operational-seed-utils";

const SEED_ACTOR_ID = "USR-EXCEL-DEMO-SEED";
const SEED_PROFILE_ID = "PERFIL-EXCEL-DEMO-SEED";

type InsertReport = { model: string; planned: number; inserted: number };
type CreateManyDelegate = { createMany(args: { data: Record<string, unknown>[]; skipDuplicates: boolean }): Promise<{ count: number }> };

function stableId(prefix: string, value: string) {
  return `${prefix}-${createHash("sha1").update(value).digest("hex").slice(0, 16)}`;
}

function yes(value: unknown) {
  return /^(sim|true|1)$/i.test(String(value ?? ""));
}

function combineDateAndTime(row: DemoRow, dateField: string, timeField: string) {
  const date = dateValue(row, dateField);
  const [hours, minutes] = text(row, timeField, "00:00").split(":").map(Number);
  date.setUTCHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

async function insertMany(
  prisma: PrismaClient,
  model: string,
  rows: Record<string, unknown>[],
  reports: InsertReport[],
) {
  if (!rows.length) return;
  const delegate = (prisma as unknown as Record<string, CreateManyDelegate>)[model];
  if (!delegate?.createMany) throw new Error(`Delegate Prisma não encontrado: ${model}.`);
  const result = await delegate.createMany({ data: rows, skipDuplicates: true });
  reports.push({ model, planned: rows.length, inserted: result.count });
}

export async function seedExcelDemo(prisma: PrismaClient, source: ExcelDemoSource) {
  if (source.issues.length) throw new Error(`Fonte Excel inválida: ${source.issues.length} erro(s).`);
  const reports: InsertReport[] = [];

  const orgs = requireTable(source, "05_Orgaos").rows;
  const units = requireTable(source, "06_Unidades").rows;
  const roles = requireTable(source, "07_Cargos").rows;
  const employees = requireTable(source, "08_Servidores").rows;
  const streets = requireTable(source, "09_Logradouros").rows;
  const households = requireTable(source, "10_Domicilios").rows;
  const people = requireTable(source, "11_Pessoas").rows;
  const payrollRows = requireTable(source, "12_Folha").rows;

  const departmentIdByOrg = new Map(orgs.map((row) => [text(row, "orgao_id"), `DEP-${text(row, "orgao_id")}`]));
  const orgByUnit = new Map(units.map((row) => [text(row, "unidade_id"), text(row, "orgao_id")]));
  const householdById = new Map(households.map((row) => [text(row, "domicilio_id"), row]));
  const streetById = new Map(streets.map((row) => [text(row, "logradouro_id"), row]));

  await insertMany(prisma, "configuracaoPerfil", [{
    id: SEED_PROFILE_ID,
    codigo: "EXCEL_DEMO_SEED",
    nome: "Operador da importação de dados",
    descricao: "Perfil técnico sem credencial operacional, usado como ator da importação.",
    permissoes: "{}",
    ativo: true,
  }], reports);
  await insertMany(prisma, "usuario", [{
    id: SEED_ACTOR_ID,
    nome: "Serviço de importação Excel",
    email: "excel-demo-seed@example.invalid",
    senha: "LEGACY_CREDENTIAL_DISABLED",
    ativo: false,
    perfilId: SEED_PROFILE_ID,
  }], reports);

  await insertMany(prisma, "secretariat", orgs.map((row) => ({
    id: text(row, "orgao_id"),
    name: text(row, "nome_orgao"),
    acronym: text(row, "orgao_id"),
    isActive: activeStatus(row.situacao),
  })), reports);
  await insertMany(prisma, "department", orgs.map((row) => ({
    id: `DEP-${text(row, "orgao_id")}`,
    name: `Departamento de ${text(row, "area")}`,
    description: `Estrutura sintética derivada de ${text(row, "nome_orgao")}.`,
    secretariatId: text(row, "orgao_id"),
    isActive: activeStatus(row.situacao),
  })), reports);
  await insertMany(prisma, "administrativeUnit", units.map((row) => ({
    id: text(row, "unidade_id"),
    name: text(row, "nome_unidade"),
    type: text(row, "tipo_unidade"),
    address: `${text(row, "bairro")} · ${text(row, "logradouro_id")}`,
    secretariatId: text(row, "orgao_id"),
    isActive: activeStatus(row.situacao),
  })), reports);
  await insertMany(prisma, "role", roles.map((row) => ({
    id: text(row, "cargo_id"),
    name: text(row, "nome_cargo"),
    description: `${text(row, "escolaridade_referencia")} · ${numberValue(row, "jornada_horas_semana")}h semanais`,
    level: text(row, "escolaridade_referencia"),
    isActive: activeStatus(row.situacao),
  })), reports);

  const neighborhoodKeys = new Map<string, string>();
  for (const row of streets) {
    const key = [text(row, "bairro"), text(row, "municipio_simulado"), text(row, "uf_cenario")].join("|");
    neighborhoodKeys.set(key, stableId("BAIRRO", key));
  }
  await insertMany(prisma, "neighborhood", [...neighborhoodKeys].map(([key, id]) => {
    const [name, city, state] = key.split("|");
    return { id, name, type: "Bairro", city, state, notes: "Dado sintético da base Excel de demonstração." };
  }), reports);
  await insertMany(prisma, "street", streets.map((row) => {
    const key = [text(row, "bairro"), text(row, "municipio_simulado"), text(row, "uf_cenario")].join("|");
    return {
      id: text(row, "logradouro_id"),
      name: text(row, "nome_logradouro"),
      type: text(row, "nome_logradouro").split(" ")[0] || "Logradouro",
      zipCode: text(row, "cep_simulado"),
      city: text(row, "municipio_simulado"),
      state: text(row, "uf_cenario"),
      neighborhoodId: neighborhoodKeys.get(key),
      status: "Ativo",
    };
  }), reports);
  await insertMany(prisma, "person", people.map((row) => ({
    id: text(row, "pessoa_id"),
    fullName: text(row, "nome_completo"),
    cpf: text(row, "documento_simulado"),
    birthDate: dateValue(row, "data_nascimento"),
    status: text(row, "situacao", "Ativo"),
    phonePrimary: text(row, "telefone_simulado") || null,
    email: text(row, "email_teste") || null,
  })), reports);
  await insertMany(prisma, "address", people.map((person) => {
    const household = householdById.get(text(person, "domicilio_id"));
    const street = household ? streetById.get(text(household, "logradouro_id")) : undefined;
    const neighborhoodKey = street
      ? [text(street, "bairro"), text(street, "municipio_simulado"), text(street, "uf_cenario")].join("|")
      : "";
    return {
      id: `ADDR-${text(person, "pessoa_id")}`,
      streetName: household ? text(household, "endereco") : null,
      number: household ? text(household, "numero") : null,
      addressType: "Residencial",
      zone: household ? text(household, "zona") : null,
      zipCode: street ? text(street, "cep_simulado") : null,
      neighborhoodId: neighborhoodKeys.get(neighborhoodKey) ?? null,
      personId: text(person, "pessoa_id"),
    };
  }), reports);
  await insertMany(prisma, "employee", employees.map((row) => ({
    id: text(row, "servidor_id"),
    name: text(row, "nome_servidor"),
    cpf: null,
    registration: text(row, "servidor_id"),
    isActive: activeStatus(row.situacao),
    salaryBase: numberValue(row, "salario_base_cenario"),
    contractedHours: numberValue(row, "jornada_horas_semana"),
    roleId: text(row, "cargo_id"),
    secretariatId: text(row, "orgao_id"),
    departmentId: departmentIdByOrg.get(text(row, "orgao_id")),
    unitId: text(row, "unidade_lotacao_id") || null,
    personId: text(row, "pessoa_id"),
  })), reports);

  const profileNames = [...new Set(requireTable(source, "36_Usuarios").rows.map((row) => text(row, "perfil")))];
  await insertMany(prisma, "configuracaoPerfil", profileNames.map((name) => ({
    id: stableId("PERFIL", name),
    codigo: `EXCEL_${stableId("P", name).replace(/-/g, "_").toUpperCase()}`,
    nome: name,
    descricao: "Perfil importado para operação municipal.",
    permissoes: "{}",
    ativo: true,
  })), reports);
  await insertMany(prisma, "usuario", requireTable(source, "36_Usuarios").rows.map((row) => ({
    id: text(row, "usuario_id"),
    nome: text(row, "nome_usuario"),
    email: text(row, "email_teste"),
    senha: "LEGACY_CREDENTIAL_DISABLED",
    ativo: activeStatus(row.situacao),
    perfilId: stableId("PERFIL", text(row, "perfil")),
    employeeId: text(row, "servidor_id") || null,
  })), reports);

  const competences = [...new Set(payrollRows.map((row) => text(row, "competencia")))];
  const payrollEvents = [
    { id: "EVT-EXCEL-SALARIO", code: "EXCEL_SALARIO_BASE", name: "Salário-base simulado", type: "Vencimento" },
    { id: "EVT-EXCEL-VANTAGENS", code: "EXCEL_VANTAGENS", name: "Vantagens simuladas", type: "Vencimento" },
    { id: "EVT-EXCEL-HORAS", code: "EXCEL_HORAS_EXTRAS", name: "Horas extras simuladas", type: "Vencimento" },
    { id: "EVT-EXCEL-DESCONTO", code: "EXCEL_DESCONTO", name: "Desconto único simulado", type: "Desconto" },
  ];
  await insertMany(prisma, "payrollEvent", payrollEvents, reports);
  await insertMany(prisma, "payroll", competences.map((competence) => ({
    id: `PAYROLL-${competence}`,
    competence: competence.split("-").reverse().join("/"),
    type: "Mensal",
    status: "Fechada",
    totalValue: payrollRows.filter((row) => text(row, "competencia") === competence).reduce((sum, row) => sum + numberValue(row, "bruto_simulado"), 0),
  })), reports);
  await insertMany(prisma, "payrollItem", payrollRows.flatMap((row) => [
    ["SALARIO", "EVT-EXCEL-SALARIO", numberValue(row, "salario_base")],
    ["VANTAGENS", "EVT-EXCEL-VANTAGENS", numberValue(row, "vantagens_simuladas")],
    ["HORAS", "EVT-EXCEL-HORAS", numberValue(row, "horas_extras_valor")],
    ["DESCONTO", "EVT-EXCEL-DESCONTO", -numberValue(row, "desconto_simulado")],
  ].map(([suffix, eventId, value]) => ({
    id: `${text(row, "folha_id")}-${suffix}`,
    payrollId: `PAYROLL-${text(row, "competencia")}`,
    employeeId: text(row, "servidor_id"),
    eventId,
    value,
    reference: text(row, "competencia"),
  }))), reports);

  await seedSuppliersAndInventory(prisma, source, reports);
  await seedAssetsAndFleet(prisma, source, reports, orgByUnit, departmentIdByOrg);
  await seedEducation(prisma, source, reports);
  await seedHealthAndSocial(prisma, source, reports, householdById);
  await seedProtocols(prisma, source, reports, departmentIdByOrg);
  await seedProcurementAndFinance(prisma, source, reports, orgByUnit, departmentIdByOrg);

  return { checksum: source.checksum, totalSourceRows: source.totalRows, reports };
}

async function seedSuppliersAndInventory(
  prisma: PrismaClient,
  source: ExcelDemoSource,
  reports: InsertReport[],
) {
  const suppliers = requireTable(source, "20_Fornecedores").rows;
  await insertMany(prisma, "company", suppliers.map((row) => ({
    id: `COMP-${text(row, "fornecedor_id")}`,
    corporateName: text(row, "razao_social_ficticia"),
    tradeName: text(row, "razao_social_ficticia"),
    cnpj: text(row, "documento_simulado"),
    status: text(row, "situacao", "Ativo"),
    emailPrimary: text(row, "email_teste") || null,
    phone: text(row, "telefone_simulado") || null,
  })), reports);
  await insertMany(prisma, "supplier", suppliers.map((row) => ({
    id: text(row, "fornecedor_id"),
    category: text(row, "segmento"),
    businessBranch: text(row, "segmento"),
    status: text(row, "situacao", "Ativo"),
    notes: `Prazo de pagamento simulado: ${numberValue(row, "prazo_pagamento_dias_cenario")} dias.`,
    companyId: `COMP-${text(row, "fornecedor_id")}`,
  })), reports);
  await insertMany(prisma, "creditor", suppliers.map((row) => ({
    id: `CRED-${text(row, "fornecedor_id")}`,
    type: "Fornecedor",
    name: text(row, "razao_social_ficticia"),
    document: text(row, "documento_simulado"),
    status: text(row, "situacao", "Ativo"),
    companyId: `COMP-${text(row, "fornecedor_id")}`,
    supplierId: text(row, "fornecedor_id"),
  })), reports);

  const warehouses = requireTable(source, "19_Almoxarifados").rows;
  await insertMany(prisma, "warehouse", warehouses.map((row) => ({
    id: text(row, "almoxarifado_id"),
    name: text(row, "nome_almoxarifado"),
    type: "Setorial",
    address: text(row, "unidade_id"),
    isActive: activeStatus(row.situacao),
    managerId: text(row, "responsavel_servidor_id") || null,
  })), reports);

  const materials = requireTable(source, "21_Materiais").rows;
  const groups = [...new Set(materials.map((row) => text(row, "grupo")))];
  await insertMany(prisma, "materialCategory", groups.map((name) => ({
    id: stableId("MCAT", name),
    code: stableId("EXCEL-MCAT", name),
    name,
    isActive: true,
  })), reports);
  await insertMany(prisma, "material", materials.map((row) => ({
    id: text(row, "material_id"),
    code: text(row, "material_id"),
    name: text(row, "descricao_material"),
    description: normalizeOperationalLabel(`${text(row, "especificacao")} · ${text(row, "marca_ficticia")}`),
    type: "MATERIAL",
    unitOfMeasure: text(row, "unidade_medida", "UN"),
    minStock: numberValue(row, "estoque_minimo"),
    maxStock: numberValue(row, "estoque_maximo"),
    isPerishable: yes(row.controla_validade),
    isActive: activeStatus(row.situacao),
    categoryId: stableId("MCAT", text(row, "grupo")),
  })), reports);

  const stocks = requireTable(source, "22_Estoque").rows;
  await insertMany(prisma, "materialStock", stocks.map((row) => ({
    id: text(row, "estoque_id"),
    quantity: numberValue(row, "saldo_atual"),
    batchNumber: text(row, "lote_simulado"),
    expirationDate: optionalDateValue(row, "validade"),
    unitCost: numberValue(row, "custo_unitario"),
    warehouseId: text(row, "almoxarifado_id"),
    materialId: text(row, "material_id"),
  })), reports);
  const stockIdByKey = new Map(stocks.map((row) => [
    [text(row, "material_id"), text(row, "almoxarifado_id"), text(row, "lote_simulado")].join("|"),
    text(row, "estoque_id"),
  ]));
  await insertMany(prisma, "materialMovement", requireTable(source, "23_Mov_Estoque").rows.map((row) => ({
    id: text(row, "movimento_id"),
    type: text(row, "tipo_movimento"),
    quantity: Math.abs(numberValue(row, "quantidade")),
    unitValue: numberValue(row, "custo_unitario"),
    date: dateValue(row, "data_movimento"),
    reason: text(row, "documento_simulado"),
    warehouseId: text(row, "almoxarifado_id"),
    materialId: text(row, "material_id"),
    stockId: stockIdByKey.get([text(row, "material_id"), text(row, "almoxarifado_id"), text(row, "lote_simulado")].join("|")) ?? null,
    supplierId: text(row, "fornecedor_id") || null,
    actorEmployeeId: text(row, "responsavel_servidor_id") || null,
  })), reports);
}

async function seedAssetsAndFleet(
  prisma: PrismaClient,
  source: ExcelDemoSource,
  reports: InsertReport[],
  orgByUnit: Map<string, string>,
  departmentIdByOrg: Map<string, string>,
) {
  const taxProperties = requireTable(source, "13_Imob_Tributario").rows;
  const publicProperties = requireTable(source, "27_Imoveis_Publicos").rows;
  await insertMany(prisma, "realEstate", [
    ...taxProperties.map((row) => ({
      id: text(row, "imovel_tributario_id"),
      municipalInsc: text(row, "inscricao_simulada"),
      registration: text(row, "imovel_tributario_id"),
      propertyType: text(row, "uso"),
      status: text(row, "situacao_tributaria"),
      streetName: text(row, "logradouro_id"),
      landArea: numberValue(row, "area_terreno_m2"),
      builtArea: numberValue(row, "area_construida_m2"),
      propertyUse: text(row, "uso"),
      fiscalZone: text(row, "zona"),
    })),
    ...publicProperties.map((row) => ({
      id: text(row, "imovel_publico_id"),
      municipalInsc: text(row, "tombo_simulado"),
      registration: text(row, "matricula_cartorio_simulada"),
      propertyType: text(row, "tipo"),
      status: text(row, "situacao"),
      streetName: text(row, "logradouro_id"),
      landArea: numberValue(row, "area_terreno_m2"),
      builtArea: numberValue(row, "area_edificada_m2"),
      propertyUse: "Público",
    })),
  ], reports);

  const movable = requireTable(source, "28_Bens_Moveis").rows;
  const animals = requireTable(source, "29_Semoventes").rows;
  const intangibles = requireTable(source, "30_Intangiveis").rows;
  const categories = new Map<string, number>();
  movable.forEach((row) => categories.set(text(row, "classe"), numberValue(row, "vida_util_meses_cenario", 60)));
  animals.forEach((row) => categories.set(`Semovente · ${text(row, "especie")}`, 120));
  intangibles.forEach((row) => categories.set(text(row, "classe_cenario"), numberValue(row, "vida_util_meses_cenario", 60)));
  categories.set("Imóveis públicos", 600);
  await insertMany(prisma, "assetCategory", [...categories].map(([name, lifeSpan]) => ({
    id: stableId("ACAT", name), code: stableId("EXCEL-ACAT", name), name, lifeSpan, isActive: true,
  })), reports);
  await insertMany(prisma, "asset", [
    ...movable.map((row) => ({
      id: text(row, "bem_movel_id"),
      patrimonyNumber: text(row, "tombo_simulado"),
      name: text(row, "descricao_bem"),
      description: `Bem sintético · ${text(row, "estado_conservacao")}`,
      serialNumber: text(row, "numero_serie_simulado") || null,
      status: text(row, "situacao"),
      acquisitionDate: dateValue(row, "data_aquisicao"),
      acquisitionValue: numberValue(row, "valor_aquisicao"),
      currentValue: numberValue(row, "valor_liquido_simulado"),
      categoryId: stableId("ACAT", text(row, "classe")),
      departmentId: departmentIdByOrg.get(text(row, "orgao_id")) ?? null,
      responsibleId: text(row, "responsavel_servidor_id") || null,
    })),
    ...publicProperties.map((row) => ({
      id: `ASSET-${text(row, "imovel_publico_id")}`,
      patrimonyNumber: text(row, "tombo_simulado"),
      name: text(row, "descricao"),
      description: text(row, "tipo"),
      status: text(row, "situacao"),
      acquisitionDate: dateValue(row, "data_incorporacao"),
      acquisitionValue: numberValue(row, "valor_cenario"),
      currentValue: numberValue(row, "valor_cenario"),
      incorporationDate: dateValue(row, "data_incorporacao"),
      categoryId: stableId("ACAT", "Imóveis públicos"),
      departmentId: departmentIdByOrg.get(text(row, "orgao_id")) ?? null,
      realEstateId: text(row, "imovel_publico_id"),
    })),
    ...animals.map((row) => ({
      id: text(row, "semovente_id"), patrimonyNumber: text(row, "tombo_simulado"), name: text(row, "nome_animal"),
      description: `${text(row, "especie")} · ${text(row, "sexo")} · ${text(row, "finalidade")}`,
      status: text(row, "situacao"), acquisitionDate: dateValue(row, "data_nascimento"),
      acquisitionValue: numberValue(row, "valor_cenario"), currentValue: numberValue(row, "valor_cenario"),
      categoryId: stableId("ACAT", `Semovente · ${text(row, "especie")}`),
      departmentId: departmentIdByOrg.get(orgByUnit.get(text(row, "unidade_id")) ?? "") ?? null,
      responsibleId: text(row, "responsavel_servidor_id") || null,
    })),
    ...intangibles.map((row) => ({
      id: text(row, "intangivel_id"), patrimonyNumber: text(row, "tombo_simulado"), name: text(row, "descricao"),
      description: text(row, "registro_simulado"), status: text(row, "situacao"),
      acquisitionDate: dateValue(row, "data_incorporacao"), acquisitionValue: numberValue(row, "custo_cenario"),
      currentValue: numberValue(row, "valor_liquido_simulado"), incorporationDate: dateValue(row, "data_incorporacao"),
      categoryId: stableId("ACAT", text(row, "classe_cenario")), departmentId: departmentIdByOrg.get(text(row, "orgao_id")) ?? null,
    })),
  ], reports);

  const fleet = requireTable(source, "24_Frota").rows;
  await insertMany(prisma, "fleetUnit", fleet.map((row) => ({
    id: text(row, "veiculo_id"), code: text(row, "prefixo_simulado"), name: text(row, "modelo_ficticio"),
    category: text(row, "categoria"), status: activeStatus(row.situacao) ? "ATIVO" : "INATIVO",
    operationalStatus: text(row, "situacao").toUpperCase(), patrimonyStatus: "EM_USO",
    plate: text(row, "placa_simulada"), brand: text(row, "marca_ficticia"), model: text(row, "modelo_ficticio"),
    year: numberValue(row, "ano_modelo"), notes: `${text(row, "combustivel")} · medidor ${text(row, "tipo_medidor")}`,
    departmentId: departmentIdByOrg.get(text(row, "orgao_id")) ?? null, assetId: text(row, "bem_movel_id"), createdById: SEED_ACTOR_ID,
  })), reports);
  await insertMany(prisma, "fleetRoute", requireTable(source, "35_Rotas_Escolares").rows.map((row) => ({
    id: text(row, "rota_id"), code: text(row, "rota_id"), name: text(row, "nome_rota"),
    origin: "Sede municipal fictícia", destination: text(row, "escola_destino_id"),
    itinerary: `${numberValue(row, "extensao_km")} km · ${numberValue(row, "duracao_minutos")} min · ${text(row, "turno")}`,
    departmentId: departmentIdByOrg.get("ORG-SIM-001") ?? "DEP-ORG-SIM-001", active: activeStatus(row.situacao), createdById: SEED_ACTOR_ID,
  })), reports);
  await insertMany(prisma, "fleetUsage", requireTable(source, "65_Viagens_Frota").rows.map((row) => ({
    id: text(row, "viagem_id"), unitId: text(row, "veiculo_id"), routeSnapshot: `${text(row, "origem")} → ${text(row, "destino")}`,
    employeeId: text(row, "motorista_servidor_id") || null, employeeName: text(row, "nome_motorista"),
    startedAt: combineDateAndTime(row, "data_saida", "hora_saida"), endedAt: combineDateAndTime(row, "data_retorno", "hora_retorno"),
    purpose: normalizeOperationalLabel(text(row, "finalidade")), initialReading: numberValue(row, "odometro_saida"), finalReading: numberValue(row, "odometro_retorno"),
    createdById: SEED_ACTOR_ID,
  })), reports);
  await insertMany(prisma, "fleetConsumption", requireTable(source, "25_Abastecimentos").rows.map((row) => ({
    id: text(row, "abastecimento_id"), unitId: text(row, "veiculo_id"), type: "ABASTECIMENTO", origin: "EXCEL_DEMO",
    occurredAt: dateValue(row, "data_abastecimento"), material: text(row, "combustivel"), quantity: numberValue(row, "litros"),
    measurementUnit: "L", cost: numberValue(row, "valor_total"), reference: `${numberValue(row, "consumo_calculado")} ${text(row, "unidade_consumo")}`,
    createdById: SEED_ACTOR_ID,
  })), reports);
  await insertMany(prisma, "fleetExpense", [
    ...requireTable(source, "25_Abastecimentos").rows.map((row) => ({
      id: `EXP-${text(row, "abastecimento_id")}`, unitId: text(row, "veiculo_id"), nature: "COMBUSTIVEL",
      occurredAt: dateValue(row, "data_abastecimento"), amount: numberValue(row, "valor_total"), description: text(row, "metodo"),
      sourceType: "EXCEL_ABASTECIMENTO", sourceId: text(row, "abastecimento_id"), sourceKey: `EXCEL:ABAST:${text(row, "abastecimento_id")}`,
      reference: text(row, "combustivel"), createdById: SEED_ACTOR_ID,
    })),
    ...requireTable(source, "26_Manutencoes").rows.map((row) => ({
      id: `EXP-${text(row, "manutencao_id")}`, unitId: text(row, "veiculo_id"), nature: "MANUTENCAO",
      occurredAt: dateValue(row, "data_abertura"), amount: numberValue(row, "custo_total"), description: text(row, "servico"),
      sourceType: "EXCEL_MANUTENCAO", sourceId: text(row, "manutencao_id"), sourceKey: `EXCEL:MAN:${text(row, "manutencao_id")}`,
      reference: text(row, "tipo"), createdById: SEED_ACTOR_ID,
    })),
  ], reports);
  const assetByVehicle = new Map(fleet.map((row) => [text(row, "veiculo_id"), text(row, "bem_movel_id")]));
  await insertMany(prisma, "assetMaintenance", [
    ...requireTable(source, "26_Manutencoes").rows.map((row) => ({
      id: text(row, "manutencao_id"), description: `${text(row, "tipo")} · ${text(row, "servico")}`,
      cost: numberValue(row, "custo_total"), status: text(row, "situacao"), startDate: dateValue(row, "data_abertura"),
      endDate: optionalDateValue(row, "data_conclusao"), assetId: assetByVehicle.get(text(row, "veiculo_id")), supplierId: text(row, "fornecedor_id") || null,
    })),
    ...requireTable(source, "67_Manutencao_Predial").rows.map((row) => ({
       id: text(row, "ordem_predial_id"), description: normalizeOperationalLabel(`${text(row, "tipo_servico")} · ${text(row, "observacao")}`),
      cost: numberValue(row, "custo_total_cenario"), status: text(row, "situacao"), startDate: dateValue(row, "data_abertura"),
      endDate: optionalDateValue(row, "data_conclusao"), assetId: `ASSET-${text(row, "imovel_publico_id")}`,
    })),
  ], reports);
  await insertMany(prisma, "assetTransfer", requireTable(source, "63_Mov_Patrimoniais").rows.map((row) => ({
    id: text(row, "movimento_patrimonial_id"), date: dateValue(row, "data_movimento"), reason: text(row, "motivo"),
    status: text(row, "situacao"), assetId: text(row, "bem_movel_id"),
    fromDepartmentId: departmentIdByOrg.get(orgByUnit.get(text(row, "unidade_origem_id")) ?? "") ?? null,
    toDepartmentId: departmentIdByOrg.get(orgByUnit.get(text(row, "unidade_destino_id")) ?? "") ?? null,
    fromResponsibleId: text(row, "responsavel_origem_id") || null, toResponsibleId: text(row, "responsavel_destino_id") || null,
  })), reports);
}

async function seedEducation(prisma: PrismaClient, source: ExcelDemoSource, reports: InsertReport[]) {
  const schools = requireTable(source, "14_Escolas").rows;
  await insertMany(prisma, "address", schools.map((row) => ({
    id: `ADDR-${text(row, "escola_id")}`, streetName: text(row, "endereco_simulado"), addressType: "Institucional", zone: text(row, "zona"),
  })), reports);
  await insertMany(prisma, "school", schools.map((row) => ({
    id: text(row, "escola_id"), name: text(row, "nome_escola"), inepCode: text(row, "codigo_inep_simulado"),
    phone: text(row, "telefone_simulado"), email: text(row, "email_teste"), capacity: numberValue(row, "capacidade_total"),
    isActive: activeStatus(row.situacao), directorId: text(row, "diretor_servidor_id") || null,
    addressId: `ADDR-${text(row, "escola_id")}`, realEstateId: text(row, "imovel_publico_id") || null,
  })), reports);
  const classes = requireTable(source, "15_Turmas").rows;
  const teacherEmployees = [...new Set(classes.map((row) => text(row, "docente_referencia_id")).filter(Boolean))];
  await insertMany(prisma, "teacher", teacherEmployees.map((employeeId) => ({ id: `TEA-${employeeId}`, employeeId })), reports);
  await insertMany(prisma, "schoolClass", classes.map((row) => ({
    id: text(row, "turma_id"), name: `${text(row, "etapa_serie")} ${text(row, "identificacao_turma")}`,
    year: numberValue(row, "ano_letivo"), stage: text(row, "etapa_serie"), grade: text(row, "etapa_serie"),
    shift: text(row, "turno"), room: text(row, "identificacao_turma"), capacity: numberValue(row, "capacidade"),
    status: text(row, "situacao") === "Ativa" ? "Aberta" : text(row, "situacao"), schoolId: text(row, "escola_id"), teacherId: `TEA-${text(row, "docente_referencia_id")}`,
  })), reports);
  const students = requireTable(source, "16_Alunos").rows;
  await insertMany(prisma, "student", students.map((row) => ({
    id: text(row, "aluno_id"), studentCode: text(row, "registro_aluno_simulado"), usesSchoolTransport: yes(row.utiliza_transporte_escolar),
    status: text(row, "situacao", "Ativo"), personId: text(row, "pessoa_id"),
  })), reports);
  await insertMany(prisma, "educationalGuardian", students.map((row) => ({
    id: `RESP-${text(row, "aluno_id")}`, kinship: text(row, "relacao_responsavel"), isFinancial: true, isAcademic: true, canPickUp: true,
    studentId: text(row, "aluno_id"), personId: text(row, "responsavel_pessoa_id"),
  })), reports);
  await insertMany(prisma, "enrollment", requireTable(source, "17_Matriculas").rows.map((row) => ({
    id: text(row, "matricula_id"), year: numberValue(row, "ano_letivo"), status: text(row, "situacao") === "Ativa" ? "Matriculado" : text(row, "situacao"),
    enrollmentDate: dateValue(row, "data_matricula"), studentId: text(row, "aluno_id"), schoolId: text(row, "escola_id"), classId: text(row, "turma_id"),
  })), reports);
  await insertMany(prisma, "schoolMeal", requireTable(source, "72_Merenda_Diaria").rows.map((row) => ({
    id: text(row, "registro_merenda_id"), date: dateValue(row, "data_servico"), menu: `${text(row, "refeicao")} · ${text(row, "cardapio_cenario")}`,
    servedQuantity: numberValue(row, "porcoes_servidas"), totalCost: numberValue(row, "custo_total_simulado"), notes: normalizeOperationalLabel(text(row, "observacao")),
    schoolId: text(row, "escola_id"),
  })), reports);
}

async function seedHealthAndSocial(
  prisma: PrismaClient,
  source: ExcelDemoSource,
  reports: InsertReport[],
  householdById: Map<string, DemoRow>,
) {
  const establishments = requireTable(source, "37_Estabelec_Saude").rows;
  await insertMany(prisma, "address", establishments.map((row) => ({
    id: `ADDR-${text(row, "estabelecimento_id")}`, streetName: text(row, "endereco_simulado"), addressType: "Institucional",
  })), reports);
  await insertMany(prisma, "healthUnit", establishments.map((row) => ({
    id: text(row, "estabelecimento_id"), name: text(row, "nome_estabelecimento"), type: text(row, "tipo_estabelecimento"),
    cnes: text(row, "codigo_cnes_simulado"), phone: text(row, "telefone_simulado"), email: text(row, "email_teste"),
    isActive: activeStatus(row.situacao), addressId: `ADDR-${text(row, "estabelecimento_id")}`,
    managerId: text(row, "responsavel_servidor_id") || null,
  })), reports);
  const establishmentByAdminUnit = new Map(establishments.map((row) => [text(row, "unidade_id"), text(row, "estabelecimento_id")]));
  const teamRows = requireTable(source, "40_Equipes_Unidades").rows.filter((row) => text(row, "estabelecimento_id"));
  const professionalByEmployee = new Map(teamRows.map((row) => [text(row, "servidor_id"), `HPRO-${text(row, "servidor_id")}`]));
  await insertMany(prisma, "healthProfessional", [...professionalByEmployee].map(([employeeId, id]) => {
    const row = teamRows.find((candidate) => text(candidate, "servidor_id") === employeeId)!;
    return { id, employeeId, specialty: text(row, "cargo"), unitId: text(row, "estabelecimento_id"), isActive: activeStatus(row.situacao) };
  }), reports);
  const patients = requireTable(source, "38_Pacientes").rows;
  await insertMany(prisma, "patient", patients.map((row) => ({
    id: text(row, "paciente_id"), cns: text(row, "cartao_sus_simulado"), status: text(row, "situacao", "Ativo"),
    personId: text(row, "pessoa_id"), referenceUnitId: text(row, "estabelecimento_referencia_id") || null,
  })), reports);
  const patientByPerson = new Map(patients.map((row) => [text(row, "pessoa_id"), text(row, "paciente_id")]));
  await insertMany(prisma, "healthAppointment", requireTable(source, "32_Atend_Saude").rows.map((row) => ({
    id: text(row, "atendimento_id"), date: combineDateAndTime(row, "data_atendimento", "hora_agendada"),
    specialty: text(row, "tipo_atendimento"), priority: "Normal",
    status: text(row, "situacao") === "Realizado" ? "Atendido" : text(row, "situacao"),
    cancelledAt: text(row, "situacao") === "Cancelado" ? combineDateAndTime(row, "data_atendimento", "hora_agendada") : null,
    cancellationReason: text(row, "situacao") === "Cancelado" ? normalizeOperationalLabel(text(row, "observacao")) : null,
    patientId: patientByPerson.get(text(row, "pessoa_id")),
    unitId: establishmentByAdminUnit.get(text(row, "unidade_id")),
    professionalId: professionalByEmployee.get(text(row, "servidor_id")) ?? null,
  })), reports);

  const socialRows = requireTable(source, "31_Atend_Social").rows;
  const socialUnits = [...new Set(socialRows.map((row) => text(row, "unidade_id")))];
  await insertMany(prisma, "socialUnit", socialUnits.map((unitId) => ({
    id: `SOC-${unitId}`, name: `Unidade social ${unitId}`, type: "CRAS", isActive: true,
  })), reports);
  const referencedHouseholds = [...new Set(socialRows.map((row) => text(row, "domicilio_id")))];
  await insertMany(prisma, "socialFamily", referencedHouseholds.map((domicilioId) => {
    const household = householdById.get(domicilioId);
    if (!household) throw new Error(`Domicílio social não encontrado: ${domicilioId}.`);
    const representativeId = text(household, "responsavel_pessoa_id");
    return { id: `FAM-${domicilioId}`, familyCode: `FAM-${domicilioId}`, status: "Ativo", representativeId, addressId: `ADDR-${representativeId}` };
  }), reports);
  await insertMany(prisma, "socialAttendance", socialRows.map((row) => ({
    id: text(row, "atendimento_id"), date: dateValue(row, "data_atendimento"), type: text(row, "tipo_servico"),
    description: text(row, "observacao"), referrals: text(row, "situacao"), secrecyLevel: "Restrito",
    isActive: !/conclu/i.test(text(row, "situacao")), familyId: `FAM-${text(row, "domicilio_id")}`,
    personId: text(row, "pessoa_id"), unitId: `SOC-${text(row, "unidade_id")}`, professionalId: text(row, "servidor_id"),
  })), reports);
}

async function seedProtocols(
  prisma: PrismaClient,
  source: ExcelDemoSource,
  reports: InsertReport[],
  departmentIdByOrg: Map<string, string>,
) {
  const protocols = requireTable(source, "33_Protocolos").rows;
  const subjects = [...new Set(protocols.map((row) => text(row, "assunto")))];
  await insertMany(prisma, "processType", [{
    id: "PT-EXCEL-PROTOCOLO", name: "Protocolo de atendimento", description: "Processos importados da base administrativa.",
    isActive: true, defaultPriority: "Normal", requiresInterested: true, allowsInternalOpening: true,
  }], reports);
  await insertMany(prisma, "subject", subjects.map((name) => ({
    id: stableId("SUBJ", name), name, description: "Assunto da base administrativa.", processTypeId: "PT-EXCEL-PROTOCOLO",
    isActive: true, requiresInterested: true, allowsInternalOpening: true,
  })), reports);
  await insertMany(prisma, "process", protocols.map((row) => ({
    id: text(row, "protocolo_id"), protocolNumber: text(row, "numero_protocolo"), status: text(row, "situacao"),
    description: `${text(row, "assunto")} · canal ${text(row, "canal")} · ${text(row, "prazo_status")}`,
    priority: "Normal", processTypeId: "PT-EXCEL-PROTOCOLO", subjectId: stableId("SUBJ", text(row, "assunto")),
    personId: text(row, "pessoa_id") || null, currentDepartmentId: departmentIdByOrg.get(text(row, "orgao_id")) ?? null,
    expectedCompletionAt: dateValue(row, "prazo_cenario"), receivedAt: dateValue(row, "data_abertura"),
    completedAt: optionalDateValue(row, "data_conclusao"), createdAt: dateValue(row, "data_abertura"),
  })), reports);
  await insertMany(prisma, "processMovement", requireTable(source, "68_Tramites_Protocolos").rows.map((row) => ({
    id: text(row, "tramite_id"), processId: text(row, "protocolo_id"),
    toDepartmentId: departmentIdByOrg.get(text(row, "orgao_destino_id")), employeeId: text(row, "responsavel_servidor_id") || null,
    reason: `${text(row, "etapa")} · ${text(row, "despacho_simulado")}`, status: text(row, "situacao_protocolo"),
    dueAt: optionalDateValue(row, "prazo_referencia"), movedAt: dateValue(row, "data_tramite"),
  })), reports);
}

async function seedProcurementAndFinance(
  prisma: PrismaClient,
  source: ExcelDemoSource,
  reports: InsertReport[],
  orgByUnit: Map<string, string>,
  departmentIdByOrg: Map<string, string>,
) {
  const catalogRows = requireTable(source, "47_Catalogo_Serv_Bens").rows;
  await insertMany(prisma, "catalogItem", catalogRows.map((row) => ({
    id: text(row, "item_catalogo_id"), code: text(row, "item_catalogo_id"), name: text(row, "descricao_item"),
    description: text(row, "especificacao"), unit: text(row, "unidade_contratual"), category: text(row, "natureza"),
    isActive: activeStatus(row.situacao),
  })), reports);

  const processRows = requireTable(source, "48_Processos_Compra").rows;
  await insertMany(prisma, "purchaseProcess", processRows.map((row) => ({
    id: text(row, "processo_compra_id"), number: text(row, "numero_simulado"), object: text(row, "descricao"), type: "Comum",
    modality: text(row, "modalidade_cenario"), status: text(row, "situacao"), secretariatId: text(row, "orgao_id"),
    createdAt: dateValue(row, "data_abertura"),
  })), reports);
  const processByContract = new Map(processRows.map((row) => [text(row, "contrato_id"), text(row, "processo_compra_id")]));
  const contractMgmt = new Map(requireTable(source, "49_Gestao_Contratos").rows.map((row) => [text(row, "contrato_id"), row]));
  await insertMany(prisma, "contract", requireTable(source, "34_Contratos").rows.map((row) => {
    const management = contractMgmt.get(text(row, "contrato_id"));
    return {
      id: text(row, "contrato_id"), number: text(row, "numero_simulado"), object: text(row, "objeto_simulado"),
      initialValue: numberValue(row, "valor_contratado"), updatedValue: numberValue(row, "valor_contratado"),
      startDate: dateValue(row, "data_inicio"), endDate: dateValue(row, "data_fim"), status: text(row, "situacao"),
      processId: processByContract.get(text(row, "contrato_id")), supplierId: text(row, "fornecedor_id"), secretariatId: text(row, "orgao_id"),
      managerId: management ? text(management, "gestor_servidor_id") || null : null,
      inspectorId: management ? text(management, "fiscal_servidor_id") || null : null,
    };
  }), reports);

  const contractItems = requireTable(source, "50_Itens_Contratos").rows;
  await insertMany(prisma, "purchaseProcessItem", contractItems.map((row) => ({
    id: text(row, "item_contrato_id"), purchaseProcessId: processByContract.get(text(row, "contrato_id")),
    catalogItemId: text(row, "item_catalogo_id") || null, customName: text(row, "descricao_item"),
    quantity: numberValue(row, "quantidade_contratada"), estimatedUnitValue: numberValue(row, "preco_unitario"),
    materialId: text(row, "material_id") || null,
  })), reports);
  const contractItemById = new Map(contractItems.map((row) => [text(row, "item_contrato_id"), row]));

  const requestRows = requireTable(source, "51_Solicitacoes_Compra").rows;
  await insertMany(prisma, "purchaseRequest", requestRows.map((row) => {
    const orgId = text(row, "orgao_id");
    return {
      id: text(row, "solicitacao_id"), number: text(row, "numero_simulado"), object: text(row, "necessidade"),
      justification: `Contrato ${text(row, "contrato_id")} · necessidade em ${text(row, "data_necessidade")}`,
      estimatedValue: numberValue(row, "valor_estimado"), status: text(row, "situacao"), priority: text(row, "prioridade"),
      secretariatId: orgId, departmentId: departmentIdByOrg.get(orgId), requesterId: text(row, "solicitante_servidor_id"),
      createdAt: dateValue(row, "data_solicitacao"),
    };
  }), reports);
  const requestById = new Map(requestRows.map((row) => [text(row, "solicitacao_id"), row]));
  const requestItems = requireTable(source, "52_Itens_Solicitacoes").rows;
  await insertMany(prisma, "purchaseRequestItem", requestItems.map((row) => {
    const contractItem = contractItemById.get(text(row, "item_contrato_id"));
    return {
      id: text(row, "item_solicitacao_id"), purchaseRequestId: text(row, "solicitacao_id"),
      catalogItemId: contractItem ? text(contractItem, "item_catalogo_id") || null : null,
      customName: text(row, "descricao_item"), quantity: numberValue(row, "quantidade_solicitada"),
      estimatedUnitValue: numberValue(row, "preco_referencia"), materialId: contractItem ? text(contractItem, "material_id") || null : null,
    };
  }), reports);
  const requestItemById = new Map(requestItems.map((row) => [text(row, "item_solicitacao_id"), row]));
  const researchIds = [...new Set(requestItems.map((row) => text(row, "solicitacao_id")))];
  await insertMany(prisma, "priceResearch", researchIds.map((requestId) => {
    const request = requestById.get(requestId)!;
    return { id: `PESQ-${requestId}`, date: dateValue(request, "data_solicitacao"), estimatedValue: numberValue(request, "valor_estimado"), status: "Concluída", processId: processByContract.get(text(request, "contrato_id")) };
  }), reports);
  await insertMany(prisma, "priceQuote", requireTable(source, "53_Cotacoes").rows.map((row) => {
    const requestItem = requestItemById.get(text(row, "item_solicitacao_id"));
    return {
      id: text(row, "cotacao_id"), value: numberValue(row, "valor_proposta"), date: dateValue(row, "data_cotacao"),
      status: text(row, "resultado"), researchId: `PESQ-${requestItem ? text(requestItem, "solicitacao_id") : "INVALID"}`,
      supplierId: text(row, "fornecedor_id"),
    };
  }), reports);

  const documents = requireTable(source, "69_Documentos_Fluxos").rows;
  await insertMany(prisma, "document", documents.map((row) => ({
    id: text(row, "documento_id"), title: text(row, "titulo"), documentType: text(row, "tipo_documento"),
    fileUrl: `ged://imports/${encodeURIComponent(text(row, "nome_arquivo_sugerido"))}`, status: "Pendente",
    notes: normalizeOperationalLabel(`${text(row, "aba_entidade")}:${text(row, "entidade_id")} · ${text(row, "observacao")}`),
    publicLabel: text(row, "classificacao_acesso"), retentionMonths: 60, createdAt: dateValue(row, "data_registro"),
  })), reports);

  const receipts = requireTable(source, "56_Recebimentos").rows;
  await insertMany(prisma, "document", receipts.map((row) => ({
    id: `DOC-${text(row, "recebimento_id")}`,
    title: `Termo de recebimento ${text(row, "recebimento_id")}`,
    documentType: "Termo de recebimento",
    fileUrl: `ged://imports/recebimentos/${encodeURIComponent(text(row, "recebimento_id"))}`,
    status: "Pendente",
    notes: "Registro de recebimento sem arquivo anexado.",
    publicLabel: "Homologação",
    retentionMonths: 60,
    createdAt: dateValue(row, "data_recebimento"),
  })), reports);
  await insertMany(prisma, "purchaseReceipt", receipts.map((row) => ({
    id: text(row, "recebimento_id"),
    number: text(row, "recebimento_id"),
    receivedAt: dateValue(row, "data_recebimento"),
    status: "APPROVED",
    contractId: text(row, "contrato_id"),
    purchaseProcessId: processByContract.get(text(row, "contrato_id")),
    documentId: `DOC-${text(row, "recebimento_id")}`,
    receiverId: text(row, "recebedor_servidor_id"),
    attesterId: text(row, "recebedor_servidor_id"),
    idempotencyKey: `EXCEL:${text(row, "recebimento_id")}`,
    sourceType: "EXCEL_DEMO",
    sourceId: text(row, "recebimento_id"),
  })), reports);
  const receiptById = new Map(receipts.map((row) => [text(row, "recebimento_id"), row]));
  const receiptDestinations = requireTable(source, "62_Destinos_Receb").rows.filter((row) =>
    text(row, "material_id") && text(row, "almoxarifado_id") && text(row, "movimento_estoque_id"),
  );
  await insertMany(prisma, "purchaseReceiptItem", receiptDestinations.map((row) => {
    const receipt = receiptById.get(text(row, "recebimento_id"));
    if (!receipt) throw new Error(`Recebimento não encontrado para ${text(row, "destino_recebimento_id")}.`);
    return {
      id: text(row, "destino_recebimento_id"),
      purchaseReceiptId: text(row, "recebimento_id"),
      purchaseProcessItemId: text(receipt, "item_contrato_id"),
      materialId: text(row, "material_id"),
      warehouseId: text(row, "almoxarifado_id"),
      quantity: numberValue(row, "quantidade_unidade_estoque"),
      quantityIncorporated: numberValue(row, "bens_tombados"),
      unitCost: numberValue(receipt, "preco_unitario") / Math.max(numberValue(row, "fator_conversao"), 1),
      batchNumber: `LOTE-${text(row, "recebimento_id")}`,
      stockMovementId: text(row, "movimento_estoque_id"),
    };
  }), reports);

  const fiscalYears = [...new Set(requireTable(source, "58_Dotacoes").rows.map((row) => numberValue(row, "exercicio")))];
  await insertMany(prisma, "financialYear", fiscalYears.map((year) => ({
    id: `FY-${year}`, year, status: "Aberto", startDate: new Date(Date.UTC(year, 0, 1)), endDate: new Date(Date.UTC(year, 11, 31, 23, 59, 59)),
  })), reports);
  const budgetUnits = [...new Set(requireTable(source, "58_Dotacoes").rows.map((row) => text(row, "orgao_id")))];
  await insertMany(prisma, "budgetUnit", budgetUnits.map((orgId) => ({
    id: `BU-${orgId}`, code: `BU-${orgId}`, name: `Unidade orçamentária ${orgId}`, secretariatId: orgId,
  })), reports);
  const dotations = requireTable(source, "58_Dotacoes").rows;
  const sources = [...new Set(dotations.map((row) => text(row, "fonte_simulada")))];
  const natures = [...new Set(dotations.map((row) => text(row, "natureza_simulada")))];
  await insertMany(prisma, "resourceSource", sources.map((name) => ({ id: stableId("RSRC", name), code: stableId("RSRC", name), name })), reports);
  await insertMany(prisma, "expenseNature", natures.map((name) => ({ id: stableId("ENAT", name), code: stableId("ENAT", name), name })), reports);
  await insertMany(prisma, "budgetAppropriation", dotations.map((row) => ({
    id: text(row, "dotacao_id"), code: text(row, "dotacao_id"), financialYearId: `FY-${numberValue(row, "exercicio")}`,
    budgetUnitId: `BU-${text(row, "orgao_id")}`, expenseNatureId: stableId("ENAT", text(row, "natureza_simulada")),
    resourceSourceId: stableId("RSRC", text(row, "fonte_simulada")), initialValue: numberValue(row, "valor_inicial"),
    updatedValue: numberValue(row, "valor_atual"), committedValue: numberValue(row, "valor_empenhado"),
  })), reports);
  await insertMany(prisma, "bankAccount", [{
    id: "BANK-EXCEL-DEMO", bankName: "Tesouraria municipal", agency: "SIM", accountNumber: "CONTA-SIM-0001",
    accountType: "Movimento", currentBalance: 0, isActive: true, externalId: "CONTA-SIM-0001", purpose: "Pagamentos importados da base administrativa.",
  }], reports);
  const commitments = requireTable(source, "59_Empenhos").rows;
  await insertMany(prisma, "commitment", commitments.map((row) => ({
    id: text(row, "empenho_id"), number: text(row, "numero_simulado"), date: dateValue(row, "data_empenho"),
    value: numberValue(row, "valor_empenhado"), type: text(row, "tipo_empenho_cenario"), history: text(row, "observacao"),
    appropriationId: text(row, "dotacao_id"), supplierId: text(row, "fornecedor_id"), creditorId: `CRED-${text(row, "fornecedor_id")}`,
    contractId: text(row, "contrato_id"), purchaseProcessId: processByContract.get(text(row, "contrato_id")), status: text(row, "situacao"),
  })), reports);
  const settlements = requireTable(source, "60_Liquidacoes").rows;
  await insertMany(prisma, "settlement", settlements.map((row) => ({
    id: text(row, "liquidacao_id"), date: dateValue(row, "data_liquidacao"), value: numberValue(row, "valor_liquidado"),
    documentRef: text(row, "nota_fiscal_id"), fiscalDocumentNumber: text(row, "nota_fiscal_id"), commitmentId: text(row, "empenho_id"),
    authorId: text(row, "atestador_servidor_id"), status: "Liquidado", notes: normalizeOperationalLabel(text(row, "observacao")),
  })), reports);
  await insertMany(prisma, "payment", requireTable(source, "61_Pagamentos").rows.map((row) => ({
      id: text(row, "pagamento_id"), orderNumber: text(row, "comprovante_simulado"), date: dateValue(row, "data_pagamento"),
      value: numberValue(row, "valor_pago"), commitmentId: text(row, "empenho_id"), settlementId: text(row, "liquidacao_id"),
      bankAccountId: "BANK-EXCEL-DEMO", supplierId: text(row, "fornecedor_id"), creditorId: `CRED-${text(row, "fornecedor_id")}`,
      paymentMethod: text(row, "meio_pagamento"), status: "Paga", bankStatus: "PENDING_SUBMISSION",
  })), reports);

  await insertMany(prisma, "procurementLifecycleEvent", requireTable(source, "70_Eventos_Fluxos").rows.map((row) => ({
    id: text(row, "evento_id"), eventType: text(row, "evento"), entityType: "PurchaseRequest", entityId: text(row, "solicitacao_id"),
    sourceType: "EXCEL_DEMO", sourceId: text(row, "registro_auditoria_simulado"), actorUsuarioId: SEED_ACTOR_ID,
    idempotencyKey: `EXCEL:${text(row, "evento_id")}`, createdAt: dateValue(row, "data_evento"),
  })), reports);

  const internalRequests = requireTable(source, "73_Requisicoes_Internas").rows;
  await insertMany(prisma, "materialRequest", internalRequests.map((row) => {
    const org = orgByUnit.get(text(row, "unidade_solicitante_id")) ?? "ORG-SIM-003";
    return {
      id: text(row, "requisicao_interna_id"), number: text(row, "requisicao_interna_id"), idempotencyKey: `EXCEL:${text(row, "requisicao_interna_id")}`,
      status: text(row, "situacao"), date: dateValue(row, "data_solicitacao"), justification: text(row, "observacao"),
      departmentId: departmentIdByOrg.get(org), requesterId: text(row, "solicitante_servidor_id"),
      issuedByEmployeeId: numberValue(row, "quantidade_atendida") > 0 ? text(row, "solicitante_servidor_id") : null,
      issuedAt: optionalDateValue(row, "data_atendimento"),
    };
  }), reports);
  await insertMany(prisma, "materialRequestItem", internalRequests.map((row) => ({
    id: `ITEM-${text(row, "requisicao_interna_id")}`, quantityRequested: numberValue(row, "quantidade_solicitada"),
    quantityApproved: numberValue(row, "quantidade_atendida"), quantityDelivered: numberValue(row, "quantidade_atendida"),
    requestId: text(row, "requisicao_interna_id"), materialId: text(row, "material_id"),
  })), reports);
}
