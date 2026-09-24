import { PrismaClient, Prisma } from "@prisma/client";

export interface TaxAuditCrossCheckInput {
  cnpjCpfContribuinte: string;
  razaoSocial: string;
  origemCruzamento: "DEISS_BANCOS" | "CARTORIO_DOI" | "CARTORIO_ITBI";
  valorDeclarado: number;
  valorApuradoBancos: number;
}

export interface TaxAuditCrossCheckResult {
  id: string;
  cnpjCpfContribuinte: string;
  razaoSocial: string;
  valorDeclarado: number;
  valorApuradoBancos: number;
  divergenciaImposto: number;
  statusMalha: string;
  numeroAutoInfracao?: string;
}

export async function runTaxAuditCrossCheck(
  prisma: PrismaClient,
  input: TaxAuditCrossCheckInput
): Promise<TaxAuditCrossCheckResult> {
  const aliquotaIss = 0.05; // 5% ISS
  const diferencaFaturamento = Math.max(0, input.valorApuradoBancos - input.valorDeclarado);
  const divergenciaImposto = diferencaFaturamento * aliquotaIss;

  const record = await prisma.taxAuditCrossCheck.create({
    data: {
      cnpjCpfContribuinte: input.cnpjCpfContribuinte,
      razaoSocial: input.razaoSocial,
      origemCruzamento: input.origemCruzamento,
      valorDeclarado: new Prisma.Decimal(input.valorDeclarado),
      valorApuradoBancos: new Prisma.Decimal(input.valorApuradoBancos),
      divergenciaImposto: new Prisma.Decimal(divergenciaImposto),
      statusMalha: "MALHA_FINA",
    },
  });

  return {
    id: record.id,
    cnpjCpfContribuinte: record.cnpjCpfContribuinte,
    razaoSocial: record.razaoSocial,
    valorDeclarado: Number(record.valorDeclarado),
    valorApuradoBancos: Number(record.valorApuradoBancos),
    divergenciaImposto: Number(record.divergenciaImposto),
    statusMalha: record.statusMalha,
  };
}

export async function issueTaxInfractionNotice(prisma: PrismaClient, crossCheckId: string) {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  const numeroAutoInfracao = `AUTO-ISS-${year}-${random}`;

  const updated = await prisma.taxAuditCrossCheck.update({
    where: { id: crossCheckId },
    data: {
      statusMalha: "AUTO_INFRACAO_EMITIDO",
      numeroAutoInfracao,
    },
  });

  return { record: updated, numeroAutoInfracao };
}
