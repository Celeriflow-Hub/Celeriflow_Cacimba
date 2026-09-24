import { PrismaClient, Prisma } from "@prisma/client";

export interface WaterBillingCalculationResult {
  leituraAnterior: number;
  leituraAtual: number;
  consumoM3: number;
  tarifaAgua: number;
  tarifaEsgoto: number;
  taxaServicos: number;
  valorTotalFatura: number;
  linhaDigitavel: string;
  qrCodePix: string;
}

/**
 * Calcula a fatura simultânea de água e esgoto com faixas progressivas
 */
export function calculateWaterBilling(
  leituraAnterior: number,
  leituraAtual: number,
  tipoTarifa: "RESIDENCIAL" | "COMERCIAL" | "INDUSTRIAL" = "RESIDENCIAL"
): WaterBillingCalculationResult {
  const consumoM3 = Math.max(0, leituraAtual - leituraAnterior);
  let valorAgua = 0;

  // Tabela de Faixas Progressivas (Tarifa Social / Residencial)
  if (consumoM3 <= 10) {
    valorAgua = 32.50; // Tarifa Mínima até 10m³
  } else if (consumoM3 <= 20) {
    valorAgua = 32.50 + (consumoM3 - 10) * 4.80;
  } else if (consumoM3 <= 50) {
    valorAgua = 32.50 + 10 * 4.80 + (consumoM3 - 20) * 7.50;
  } else {
    valorAgua = 32.50 + 10 * 4.80 + 30 * 7.50 + (consumoM3 - 50) * 11.20;
  }

  if (tipoTarifa === "COMERCIAL") valorAgua *= 1.4;
  if (tipoTarifa === "INDUSTRIAL") valorAgua *= 1.8;

  const tarifaEsgoto = valorAgua * 0.8; // 80% da tarifa de água
  const taxaServicos = 5.0; // Taxa de expediente/leitura
  const valorTotalFatura = valorAgua + tarifaEsgoto + taxaServicos;

  const timestamp = Date.now();
  const linhaDigitavel = `8367000000${Math.floor(valorTotalFatura)}0026001234567890`;
  const qrCodePix = `00020126580014BR.GOV.BCB.PIX0136agua-fatura-${timestamp}5204000053039865405${valorTotalFatura.toFixed(2)}5802BR5922SERVICO SANEAMENTO MUN6009CAMPINA GR62070503***6304D1A4`;

  return {
    leituraAnterior,
    leituraAtual,
    consumoM3,
    tarifaAgua: valorAgua,
    tarifaEsgoto,
    taxaServicos,
    valorTotalFatura,
    linhaDigitavel,
    qrCodePix,
  };
}

export async function processWaterReadingAndBill(
  prisma: PrismaClient,
  input: {
    codigoMatricula: string;
    nomeConsumidor: string;
    endereco: string;
    numeroHidrometro: string;
    leituraAnterior: number;
    leituraAtual: number;
    tipoTarifa?: "RESIDENCIAL" | "COMERCIAL" | "INDUSTRIAL";
  }
) {
  const billing = calculateWaterBilling(input.leituraAnterior, input.leituraAtual, input.tipoTarifa || "RESIDENCIAL");

  const record = await prisma.waterMeterReading.create({
    data: {
      codigoMatricula: input.codigoMatricula,
      nomeConsumidor: input.nomeConsumidor,
      endereco: input.endereco,
      numeroHidrometro: input.numeroHidrometro,
      leituraAnterior: input.leituraAnterior,
      leituraAtual: input.leituraAtual,
      consumoM3: billing.consumoM3,
      valorFatura: new Prisma.Decimal(billing.valorTotalFatura),
      tipoTarifa: input.tipoTarifa || "RESIDENCIAL",
      statusFatura: "EMITIDA",
      linhaDigitavel: billing.linhaDigitavel,
      qrCodePix: billing.qrCodePix,
    },
  });

  return { record, billing };
}
