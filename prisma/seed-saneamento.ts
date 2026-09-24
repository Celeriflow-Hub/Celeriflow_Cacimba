/**
 * Cenários sintéticos para demonstração do módulo de Água e Saneamento.
 * Pode ser executado novamente sem duplicar registros.
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const competence = "07/2026";

const units = [
  { code: "DEMO-SAN-001", address: "Rua das Acácias, 120, Centro", category: "Residencial", ownerName: "Ana Ribeiro", ownerDocument: "000.000.001-91", status: "Ativa", previousValue: 120, currentValue: 138, readerName: "Marcos Lima" },
  { code: "DEMO-SAN-002", address: "Avenida do Comércio, 45, Vila Nova", category: "Comercial", ownerName: "Mercado Horizonte Ltda.", ownerDocument: "00.000.002/0001-02", status: "Ativa", previousValue: 450, currentValue: 512, readerName: "Marcos Lima" },
  { code: "DEMO-SAN-003", address: "Estrada Municipal 08, Km 4, Zona Rural", category: "Rural", ownerName: "Paulo Nogueira", ownerDocument: "000.000.003-73", status: "Cortada", previousValue: 60, currentValue: 75, readerName: "Renata Alves" },
  { code: "DEMO-SAN-004", address: "Praça da Comunidade, 10, Jardim Sul", category: "Pública", ownerName: "Escola Municipal Aurora", ownerDocument: "00.000.004/0001-84", status: "Ativa", previousValue: 980, currentValue: 1018, readerName: "Renata Alves" },
] as const;

const serviceOrders = [
  { orderNumber: "OS-DEMO-2026-001", unitCode: "DEMO-SAN-001", orderType: "Vazamento", description: "Verificação de vazamento no ramal externo.", priority: "Alta", status: "Em Andamento", technician: "Carlos Mendes" },
  { orderNumber: "OS-DEMO-2026-002", unitCode: "DEMO-SAN-002", orderType: "Manutenção", description: "Inspeção preventiva do padrão de ligação.", priority: "Normal", status: "Aberta", technician: "Juliana Rocha" },
  { orderNumber: "OS-DEMO-2026-003", unitCode: "DEMO-SAN-003", orderType: "Corte", description: "Corte executado conforme ordem de serviço demonstrativa.", priority: "Normal", status: "Concluída", technician: "Carlos Mendes" },
  { orderNumber: "OS-DEMO-2026-004", unitCode: "DEMO-SAN-004", orderType: "Religação", description: "Religação concluída após regularização demonstrativa.", priority: "Alta", status: "Concluída", technician: "Juliana Rocha" },
] as const;

const invoices = [
  { invoiceNumber: "FAT-DEMO-2026-001", unitCode: "DEMO-SAN-001", totalAmount: 72.5, dueDate: new Date("2026-08-10T12:00:00.000Z"), status: "Paga" },
  { invoiceNumber: "FAT-DEMO-2026-002", unitCode: "DEMO-SAN-002", totalAmount: 186.4, dueDate: new Date("2026-08-10T12:00:00.000Z"), status: "Emitida" },
  { invoiceNumber: "FAT-DEMO-2026-003", unitCode: "DEMO-SAN-003", totalAmount: 58.9, dueDate: new Date("2026-07-10T12:00:00.000Z"), status: "Vencida" },
  { invoiceNumber: "FAT-DEMO-2026-004", unitCode: "DEMO-SAN-004", totalAmount: 114.75, dueDate: new Date("2026-08-15T12:00:00.000Z"), status: "Emitida" },
] as const;

const qualityAnalyses = [
  { collectionPoint: "ETA Principal", collectedAt: new Date("2026-07-15T12:00:00.000Z"), parameter: "Turbidez", result: "0,5 NTU", limit: "5,0 NTU", compliance: "Conforme" },
  { collectionPoint: "ETA Principal", collectedAt: new Date("2026-07-15T12:00:00.000Z"), parameter: "Cloro residual", result: "1,2 mg/L", limit: "0,2 a 2,0 mg/L", compliance: "Conforme" },
  { collectionPoint: "Rede Jardim Sul", collectedAt: new Date("2026-07-14T12:00:00.000Z"), parameter: "Coliformes", result: "Ausente", limit: "Ausente", compliance: "Conforme" },
  { collectionPoint: "ETE Central", collectedAt: new Date("2026-07-14T12:00:00.000Z"), parameter: "DBO", result: "65 mg/L", limit: "Máximo 50 mg/L", compliance: "Não Conforme" },
] as const;

const portalRequests = [
  { requestType: "2ª via de conta", requesterName: "Ana Ribeiro", requestedAt: new Date("2026-07-16T12:00:00.000Z"), source: "Aplicativo", status: "Atendido" },
  { requestType: "Aviso de vazamento", requesterName: "Comercial Horizonte", requestedAt: new Date("2026-07-15T12:00:00.000Z"), source: "Portal web", status: "Em análise" },
  { requestType: "Alteração de titularidade", requesterName: "Paulo Nogueira", requestedAt: new Date("2026-07-15T12:00:00.000Z"), source: "Atendimento", status: "Pendente de documentos" },
  { requestType: "Histórico de consumo", requesterName: "Escola Municipal Aurora", requestedAt: new Date("2026-07-14T12:00:00.000Z"), source: "Aplicativo", status: "Atendido" },
] as const;

const reports = [
  { name: "Inadimplência por categoria", type: "Financeiro", period: "Julho/2026", format: "PDF" },
  { name: "Consumo médio por bairro", type: "Operacional", period: "Últimos 6 meses", format: "PDF/Excel" },
  { name: "Ordens de serviço por tipo", type: "Serviços", period: "Julho/2026", format: "Excel" },
  { name: "Análises de qualidade da água", type: "Qualidade", period: "Julho/2026", format: "PDF" },
] as const;

async function main() {
  const unitIds = new Map<string, string>();

  for (const unit of units) {
    const savedUnit = await prisma.sanConsumerUnit.upsert({
      where: { code: unit.code },
      create: {
        code: unit.code,
        address: unit.address,
        category: unit.category,
        ownerName: unit.ownerName,
        ownerDocument: unit.ownerDocument,
        status: unit.status,
      },
      update: {
        address: unit.address,
        category: unit.category,
        ownerName: unit.ownerName,
        ownerDocument: unit.ownerDocument,
        status: unit.status,
      },
    });
    unitIds.set(unit.code, savedUnit.id);

    await prisma.sanMeterReading.upsert({
      where: { unitId_competence: { unitId: savedUnit.id, competence } },
      create: {
        unitId: savedUnit.id,
        competence,
        previousValue: unit.previousValue,
        currentValue: unit.currentValue,
        consumption: unit.currentValue - unit.previousValue,
        readerName: unit.readerName,
        status: "Registrada",
      },
      update: {
        previousValue: unit.previousValue,
        currentValue: unit.currentValue,
        consumption: unit.currentValue - unit.previousValue,
        readerName: unit.readerName,
        status: "Registrada",
      },
    });
  }

  for (const order of serviceOrders) {
    const unitId = unitIds.get(order.unitCode);
    if (!unitId) throw new Error(`Unidade ausente para ${order.orderNumber}.`);
    await prisma.sanServiceOrder.upsert({
      where: { orderNumber: order.orderNumber },
      create: { orderNumber: order.orderNumber, orderType: order.orderType, description: order.description, priority: order.priority, status: order.status, technician: order.technician, unitId },
      update: { orderType: order.orderType, description: order.description, priority: order.priority, status: order.status, technician: order.technician, unitId },
    });
  }

  for (const invoice of invoices) {
    const unitId = unitIds.get(invoice.unitCode);
    if (!unitId) throw new Error(`Unidade ausente para ${invoice.invoiceNumber}.`);
    await prisma.sanInvoice.upsert({
      where: { invoiceNumber: invoice.invoiceNumber },
      create: { invoiceNumber: invoice.invoiceNumber, totalAmount: invoice.totalAmount, dueDate: invoice.dueDate, status: invoice.status, unitId, competence },
      update: { totalAmount: invoice.totalAmount, dueDate: invoice.dueDate, status: invoice.status, unitId, competence },
    });
  }

  for (const analysis of qualityAnalyses) {
    const existing = await prisma.sanWaterQualityAnalysis.findFirst({ where: { collectionPoint: analysis.collectionPoint, collectedAt: analysis.collectedAt, parameter: analysis.parameter } });
    if (existing) await prisma.sanWaterQualityAnalysis.update({ where: { id: existing.id }, data: analysis });
    else await prisma.sanWaterQualityAnalysis.create({ data: analysis });
  }

  for (const request of portalRequests) {
    const existing = await prisma.sanPortalRequest.findFirst({ where: { requestType: request.requestType, requesterName: request.requesterName, requestedAt: request.requestedAt } });
    if (existing) await prisma.sanPortalRequest.update({ where: { id: existing.id }, data: request });
    else await prisma.sanPortalRequest.create({ data: request });
  }

  for (const report of reports) {
    const existing = await prisma.sanSavedReport.findFirst({ where: { name: report.name, period: report.period } });
    if (existing) await prisma.sanSavedReport.update({ where: { id: existing.id }, data: report });
    else await prisma.sanSavedReport.create({ data: report });
  }

  console.log("Cenários demonstrativos de saneamento criados ou atualizados.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
