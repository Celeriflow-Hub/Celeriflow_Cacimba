/**
 * Cenários sintéticos e idempotentes para demonstração do módulo Obras e Serviços.
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const obras = [
  { numero: "OBR-DEMO-2026-001", nome: "Ampliação da Escola Municipal Aurora", descricao: "Construção de quatro novas salas de aula e adequação de acessibilidade.", local: "Rua das Palmeiras, 180, Centro", tipo: "Construção", valorEstimado: 1250000, status: "Em Execução" },
  { numero: "OBR-DEMO-2026-002", nome: "Recapeamento da Avenida Principal", descricao: "Recapeamento asfáltico e sinalização horizontal em trecho urbano.", local: "Avenida Principal, Bairro Novo", tipo: "Pavimentação", valorEstimado: 840000, status: "Concluída" },
  { numero: "OBR-DEMO-2026-003", nome: "Drenagem do Bairro Alvorada", descricao: "Implantação de rede de drenagem pluvial e bocas de lobo.", local: "Bairro Alvorada", tipo: "Drenagem", valorEstimado: 630000, status: "Paralisada" },
  { numero: "OBR-DEMO-2026-004", nome: "Reforma da UBS Jardim Sul", descricao: "Reforma de cobertura, pintura e adequação dos consultórios.", local: "Praça da Comunidade, 10, Jardim Sul", tipo: "Reforma", valorEstimado: 390000, status: "Em Planejamento" },
] as const;

const measurements = [
  { obraNumero: "OBR-DEMO-2026-001", numero: 1, data: new Date("2026-06-15T12:00:00.000Z"), valorMedido: 185000, status: "Aprovada" },
  { obraNumero: "OBR-DEMO-2026-001", numero: 2, data: new Date("2026-07-15T12:00:00.000Z"), valorMedido: 142500, status: "Em Análise" },
  { obraNumero: "OBR-DEMO-2026-002", numero: 1, data: new Date("2026-05-20T12:00:00.000Z"), valorMedido: 840000, status: "Aprovada" },
  { obraNumero: "OBR-DEMO-2026-003", numero: 1, data: new Date("2026-06-10T12:00:00.000Z"), valorMedido: 72000, status: "Rejeitada" },
] as const;

const services = [
  { protocolo: "OSU-DEMO-2026-001", tipo: "Limpeza", descricao: "Capina e roçada nas áreas públicas do Bairro Alvorada.", local: "Bairro Alvorada", status: "Em Andamento" },
  { protocolo: "OSU-DEMO-2026-002", tipo: "Pavimentação", descricao: "Tapa-buracos em vias prioritárias do centro.", local: "Rua São João e vias adjacentes", status: "Aberto" },
  { protocolo: "OSU-DEMO-2026-003", tipo: "Paisagismo", descricao: "Poda preventiva de árvores na Praça da Matriz.", local: "Praça da Matriz", status: "Concluído" },
  { protocolo: "OSU-DEMO-2026-004", tipo: "Iluminação", descricao: "Substituição de luminárias por LED em trecho da avenida.", local: "Avenida Brasil, Jardim Sul", status: "Em Andamento" },
] as const;

async function main() {
  const obraIds = new Map<string, string>();

  for (const obra of obras) {
    const saved = await prisma.obrasObra.upsert({
      where: { numero: obra.numero },
      create: { ...obra },
      update: { nome: obra.nome, descricao: obra.descricao, local: obra.local, tipo: obra.tipo, valorEstimado: obra.valorEstimado, status: obra.status, active: true },
    });
    obraIds.set(obra.numero, saved.id);
  }

  for (const measurement of measurements) {
    const obraId = obraIds.get(measurement.obraNumero);
    if (!obraId) throw new Error(`Obra ausente para a medição ${measurement.numero}.`);
    await prisma.obrasMedicao.upsert({
      where: { obraId_numero: { obraId, numero: measurement.numero } },
      create: { obraId, numero: measurement.numero, data: measurement.data, valorMedido: measurement.valorMedido, status: measurement.status },
      update: { data: measurement.data, valorMedido: measurement.valorMedido, status: measurement.status, active: true },
    });
  }

  for (const service of services) {
    await prisma.obrasServico.upsert({
      where: { protocolo: service.protocolo },
      create: { ...service },
      update: { tipo: service.tipo, descricao: service.descricao, local: service.local, status: service.status, active: true },
    });
  }

  const worksSecretariat = await prisma.secretariat.findFirst({ where: { name: "Secretaria de Obras e Serviços Urbanos" } })
    ?? await prisma.secretariat.create({ data: { name: "Secretaria de Obras e Serviços Urbanos", acronym: "SEOBRAS" } });
  const worksDepartment = await prisma.department.findFirst({ where: { name: "Departamento de Manutenção Urbana", secretariatId: worksSecretariat.id } })
    ?? await prisma.department.create({ data: { name: "Departamento de Manutenção Urbana", secretariatId: worksSecretariat.id } });
  const role = await prisma.role.findFirst({ where: { name: "Técnico de Manutenção Urbana" } })
    ?? await prisma.role.create({ data: { name: "Técnico de Manutenção Urbana", description: "Execução de manutenção de infraestrutura urbana." } });

  const electrician = await prisma.employee.upsert({
    where: { cpf: "00011122233" },
    create: { name: "Lucas Ferreira", cpf: "00011122233", registration: "OBR-1001", roleId: role.id, secretariatId: worksSecretariat.id, departmentId: worksDepartment.id },
    update: { name: "Lucas Ferreira", roleId: role.id, secretariatId: worksSecretariat.id, departmentId: worksDepartment.id, isActive: true },
  });
  const driver = await prisma.employee.upsert({
    where: { cpf: "00011122244" },
    create: { name: "Mariana Costa", cpf: "00011122244", registration: "OBR-1002", roleId: role.id, secretariatId: worksSecretariat.id, departmentId: worksDepartment.id },
    update: { name: "Mariana Costa", roleId: role.id, secretariatId: worksSecretariat.id, departmentId: worksDepartment.id, isActive: true },
  });

  const municipalProperty = await prisma.realEstate.upsert({
    where: { municipalInsc: "IMOV-OBR-2026-001" },
    create: { municipalInsc: "IMOV-OBR-2026-001", propertyType: "Logradouro Público", streetName: "Avenida Brasil", number: "S/N", status: "Regular" },
    update: { propertyType: "Logradouro Público", streetName: "Avenida Brasil", number: "S/N", status: "Regular" },
  });
  const lightingCategory = await prisma.assetCategory.upsert({
    where: { code: "OBR-ILUM" },
    create: { code: "OBR-ILUM", name: "Infraestrutura de Iluminação Pública", lifeSpan: 120 },
    update: { name: "Infraestrutura de Iluminação Pública", isActive: true },
  });
  const equipmentCategory = await prisma.assetCategory.upsert({
    where: { code: "OBR-EQP" },
    create: { code: "OBR-EQP", name: "Máquinas e Equipamentos de Obras", lifeSpan: 120 },
    update: { name: "Máquinas e Equipamentos de Obras", isActive: true },
  });
  const lightingAsset = await prisma.asset.upsert({
    where: { patrimonyNumber: "PAT-OBR-2026-001" },
    create: { patrimonyNumber: "PAT-OBR-2026-001", name: "Conjunto de Postes LED - Avenida Brasil", description: "Trecho de iluminação pública com luminárias LED.", status: "Ativo", acquisitionDate: new Date("2025-12-15"), acquisitionValue: 68000, currentValue: 64000, categoryId: lightingCategory.id, departmentId: worksDepartment.id, realEstateId: municipalProperty.id, responsibleId: electrician.id },
    update: { status: "Ativo", categoryId: lightingCategory.id, departmentId: worksDepartment.id, realEstateId: municipalProperty.id, responsibleId: electrician.id },
  });
  const bucketTruck = await prisma.asset.upsert({
    where: { patrimonyNumber: "PAT-OBR-2026-002" },
    create: { patrimonyNumber: "PAT-OBR-2026-002", name: "Caminhão Munck com Cesto Aéreo", status: "Em uso", acquisitionDate: new Date("2024-08-10"), acquisitionValue: 320000, currentValue: 280000, categoryId: equipmentCategory.id, departmentId: worksDepartment.id, responsibleId: driver.id },
    update: { status: "Em uso", categoryId: equipmentCategory.id, departmentId: worksDepartment.id, responsibleId: driver.id },
  });

  const lightingMaterialCategory = await prisma.materialCategory.upsert({
    where: { code: "MAT-ILUM" },
    create: { code: "MAT-ILUM", name: "Materiais de Iluminação Pública" },
    update: { name: "Materiais de Iluminação Pública", isActive: true },
  });
  const ledLamp = await prisma.material.upsert({
    where: { code: "MAT-LED-100W" },
    create: { code: "MAT-LED-100W", name: "Luminária LED 100W para via pública", unitOfMeasure: "UN", minStock: 10, maxStock: 100, categoryId: lightingMaterialCategory.id },
    update: { name: "Luminária LED 100W para via pública", categoryId: lightingMaterialCategory.id },
  });
  const warehouse = await prisma.warehouse.findFirst({ where: { name: "Almoxarifado de Obras" } })
    ?? await prisma.warehouse.create({ data: { name: "Almoxarifado de Obras", type: "Setorial", address: "Pátio Municipal", managerId: driver.id } });
  const lampStock = await prisma.materialStock.findFirst({ where: { warehouseId: warehouse.id, materialId: ledLamp.id } })
    ?? await prisma.materialStock.create({ data: { warehouseId: warehouse.id, materialId: ledLamp.id, quantity: 50, unitCost: 185 } });

  const company = await prisma.company.upsert({
    where: { cnpj: "11222333000144" },
    create: { corporateName: "Ilumina Brasil Equipamentos Ltda.", cnpj: "11222333000144" },
    update: { corporateName: "Ilumina Brasil Equipamentos Ltda." },
  });
  const supplier = await prisma.supplier.findFirst({ where: { companyId: company.id } })
    ?? await prisma.supplier.create({ data: { companyId: company.id, category: "Materiais Elétricos", status: "Ativo" } });

  const financialYear = await prisma.financialYear.upsert({ where: { year: 2026 }, create: { year: 2026, startDate: new Date("2026-01-01"), endDate: new Date("2026-12-31") }, update: { status: "Aberto" } });
  const budgetUnit = await prisma.budgetUnit.upsert({ where: { code: "UO-OBR-2026" }, create: { code: "UO-OBR-2026", name: "Unidade Orçamentária de Obras", secretariatId: worksSecretariat.id }, update: { name: "Unidade Orçamentária de Obras", secretariatId: worksSecretariat.id } });
  const resourceSource = await prisma.resourceSource.upsert({ where: { code: "REC-OBR-001" }, create: { code: "REC-OBR-001", name: "Recursos Ordinários" }, update: { name: "Recursos Ordinários" } });
  const expenseNature = await prisma.expenseNature.upsert({ where: { code: "NAT-OBR-001" }, create: { code: "NAT-OBR-001", name: "Manutenção de Iluminação Pública" }, update: { name: "Manutenção de Iluminação Pública" } });
  const appropriation = await prisma.budgetAppropriation.upsert({
    where: { code: "DOT-OBR-2026-001" },
    create: { code: "DOT-OBR-2026-001", financialYearId: financialYear.id, budgetUnitId: budgetUnit.id, expenseNatureId: expenseNature.id, resourceSourceId: resourceSource.id, initialValue: 250000, updatedValue: 250000, committedValue: 45000 },
    update: { financialYearId: financialYear.id, budgetUnitId: budgetUnit.id, expenseNatureId: expenseNature.id, resourceSourceId: resourceSource.id },
  });
  const commitment = await prisma.commitment.upsert({
    where: { number: "EMP-OBR-2026-001" },
    create: { number: "EMP-OBR-2026-001", date: new Date("2026-07-01"), value: 45000, type: "Ordinário", history: "Aquisição de materiais para manutenção de iluminação pública.", appropriationId: appropriation.id, supplierId: supplier.id, status: "Emitido" },
    update: { value: 45000, history: "Aquisição de materiais para manutenção de iluminação pública.", appropriationId: appropriation.id, supplierId: supplier.id, status: "Emitido" },
  });

  const purchaseRequest = await prisma.purchaseRequest.upsert({
    where: { number: "SC-OBR-2026-001" },
    create: { number: "SC-OBR-2026-001", object: "Luminárias LED para manutenção urbana", justification: "Reposição de luminárias em vias públicas.", estimatedValue: 9250, status: "Aprovada", priority: "Alta", secretariatId: worksSecretariat.id, departmentId: worksDepartment.id, requesterId: electrician.id, items: { create: { materialId: ledLamp.id, quantity: 50, estimatedUnitValue: 185 } } },
    update: { object: "Luminárias LED para manutenção urbana", justification: "Reposição de luminárias em vias públicas.", estimatedValue: 9250, status: "Aprovada", secretariatId: worksSecretariat.id, departmentId: worksDepartment.id, requesterId: electrician.id },
  });
  const purchaseProcess = await prisma.purchaseProcess.upsert({
    where: { number: "PC-OBR-2026-001" },
    create: { number: "PC-OBR-2026-001", object: "Aquisição de luminárias LED", type: "Comum", modality: "Pregão", estimatedValue: 45000, status: "Em Andamento", secretariatId: worksSecretariat.id, items: { create: { materialId: ledLamp.id, quantity: 200, estimatedUnitValue: 185 } } },
    update: { object: "Aquisição de luminárias LED", estimatedValue: 45000, status: "Em Andamento", secretariatId: worksSecretariat.id },
  });

  const fieldTeam = await prisma.obrasEquipe.upsert({ where: { code: "EQ-OBR-ILUM-01" }, create: { code: "EQ-OBR-ILUM-01", name: "Equipe de Iluminação Norte", departmentId: worksDepartment.id }, update: { name: "Equipe de Iluminação Norte", departmentId: worksDepartment.id, isActive: true } });
  await prisma.obrasEquipeMembro.upsert({ where: { equipeId_employeeId: { equipeId: fieldTeam.id, employeeId: electrician.id } }, create: { equipeId: fieldTeam.id, employeeId: electrician.id, isLeader: true }, update: { isLeader: true, isActive: true } });
  await prisma.obrasEquipeMembro.upsert({ where: { equipeId_employeeId: { equipeId: fieldTeam.id, employeeId: driver.id } }, create: { equipeId: fieldTeam.id, employeeId: driver.id }, update: { isActive: true } });

  const gedFolder = await prisma.folder.findFirst({ where: { name: "Obras e Serviços Urbanos" } })
    ?? await prisma.folder.create({ data: { name: "Obras e Serviços Urbanos", description: "Documentos técnicos e ordens de serviço." } });
  const gedDocument = await prisma.document.findFirst({ where: { title: "Laudo de manutenção - Avenida Brasil", folderId: gedFolder.id } })
    ?? await prisma.document.create({ data: { title: "Laudo de manutenção - Avenida Brasil", documentType: "Laudo Técnico", fileUrl: "/logo1.png", folderId: gedFolder.id, status: "Válido", notes: "Documento técnico vinculado à manutenção de iluminação." } });

  const lightingService = await prisma.obrasServico.findUnique({ where: { protocolo: "OSU-DEMO-2026-004" } });
  if (!lightingService) throw new Error("Ordem de iluminação não encontrada.");
  await prisma.obrasServico.update({ where: { id: lightingService.id }, data: { departmentId: worksDepartment.id, targetAssetId: lightingAsset.id, budgetAppropriationId: appropriation.id, commitmentId: commitment.id, scheduledFor: new Date("2026-07-22"), estimatedCost: 740 } });
  await prisma.obrasServicoEmployee.upsert({ where: { obrasServicoId_employeeId: { obrasServicoId: lightingService.id, employeeId: electrician.id } }, create: { obrasServicoId: lightingService.id, employeeId: electrician.id, role: "Eletricista responsável" }, update: { role: "Eletricista responsável", releasedAt: null } });
  await prisma.obrasServicoEquipe.upsert({ where: { obrasServicoId_equipeId: { obrasServicoId: lightingService.id, equipeId: fieldTeam.id } }, create: { obrasServicoId: lightingService.id, equipeId: fieldTeam.id }, update: { releasedAt: null } });
  await prisma.obrasServicoEquipamento.upsert({ where: { obrasServicoId_assetId: { obrasServicoId: lightingService.id, assetId: bucketTruck.id } }, create: { obrasServicoId: lightingService.id, assetId: bucketTruck.id }, update: { releasedAt: null } });
  await prisma.obrasServicoDocumento.upsert({ where: { obrasServicoId_documentId: { obrasServicoId: lightingService.id, documentId: gedDocument.id } }, create: { obrasServicoId: lightingService.id, documentId: gedDocument.id, purpose: "Laudo técnico" }, update: { purpose: "Laudo técnico" } });
  await prisma.obrasServicoCompra.upsert({ where: { obrasServicoId_purchaseRequestId: { obrasServicoId: lightingService.id, purchaseRequestId: purchaseRequest.id } }, create: { obrasServicoId: lightingService.id, purchaseRequestId: purchaseRequest.id, purpose: "Reposição de luminárias" }, update: { purpose: "Reposição de luminárias" } });
  await prisma.obrasServicoCompra.upsert({ where: { obrasServicoId_purchaseProcessId: { obrasServicoId: lightingService.id, purchaseProcessId: purchaseProcess.id } }, create: { obrasServicoId: lightingService.id, purchaseProcessId: purchaseProcess.id, purpose: "Aquisição de luminárias" }, update: { purpose: "Aquisição de luminárias" } });

  const issuedMovement = await prisma.materialMovement.findFirst({ where: { obrasServicoId: lightingService.id, materialId: ledLamp.id, reason: "Execução de ordem de serviço" } });
  if (!issuedMovement) {
    await prisma.$transaction([
      prisma.materialStock.update({ where: { id: lampStock.id }, data: { quantity: { decrement: 4 } } }),
      prisma.materialMovement.create({ data: { type: "Saída", quantity: 4, unitValue: lampStock.unitCost, reason: "Execução de ordem de serviço", warehouseId: warehouse.id, materialId: ledLamp.id, departmentId: worksDepartment.id, obrasServicoId: lightingService.id } }),
    ]);
  }
  await prisma.obrasServicoMaterial.upsert({ where: { obrasServicoId_materialId: { obrasServicoId: lightingService.id, materialId: ledLamp.id } }, create: { obrasServicoId: lightingService.id, materialId: ledLamp.id, stockId: lampStock.id, quantityPlanned: 4, quantityIssued: 4, unitCost: lampStock.unitCost }, update: { stockId: lampStock.id, quantityPlanned: 4, quantityIssued: 4, unitCost: lampStock.unitCost } });

  console.log("Cenários demonstrativos de Obras e Serviços criados ou atualizados.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
