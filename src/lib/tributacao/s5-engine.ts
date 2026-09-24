import { Prisma } from "@prisma/client";
export class TributarioS5Error extends Error {}
const decimal = (value: Prisma.Decimal | string | number, label: string) => { const result = new Prisma.Decimal(String(value)).toDecimalPlaces(2); if (!result.isFinite() || result.lessThan(0)) throw new TributarioS5Error(`${label} inválido.`); return result; };

export function calculateSimplesCrossCheck(input: { nfseService: Prisma.Decimal | string | number; declaredService: Prisma.Decimal | string | number; municipalIssDeclared: Prisma.Decimal | string | number; daf607Confirmed: Prisma.Decimal | string | number; nationalDasTotal?: Prisma.Decimal | string | number }) {
  const nfseService = decimal(input.nfseService, "NFS-e"); const declaredService = decimal(input.declaredService, "Declaração");
  const municipalIssDeclared = decimal(input.municipalIssDeclared, "Componente municipal"); const daf607Confirmed = decimal(input.daf607Confirmed, "DAF607");
  const nationalDasTotal = decimal(input.nationalDasTotal ?? 0, "DAS nacional");
  return { nfseService, declaredService, revenueDifference: nfseService.minus(declaredService).toDecimalPlaces(2), municipalIssDeclared, daf607Confirmed, paymentDifference: municipalIssDeclared.minus(daf607Confirmed).toDecimalPlaces(2), nationalDasTotal, paymentBasis: "MUNICIPAL_COMPONENT" as const };
}

export function classifySimplesDivergences(input: { expected: boolean; nfseService: number; declaredService: number; revenueDifference: number; municipalIssDeclared: number; paymentDifference: number; declaredRate?: number | null; expectedRate?: number | null; activityCode?: string | null; isEstimate?: boolean }) {
  const types: string[] = [];
  if (input.nfseService > 0 && input.declaredService === 0) types.push("FALTA_DECLARACAO");
  if (input.declaredService > 0 && input.nfseService === 0) types.push("DECLARACAO_SEM_NFSE");
  if (input.expected && input.declaredService === 0 && input.nfseService === 0) types.push("AUSENCIA_AMBOS");
  if (input.nfseService > 0 && input.declaredService > 0 && Math.abs(input.revenueDifference) >= .01) types.push("NFSE_X_DECLARACAO");
  if (Math.abs(input.paymentDifference) >= .01) types.push("PAGAMENTO");
  if (input.declaredRate != null && input.expectedRate != null && Math.abs(input.declaredRate - input.expectedRate) >= .000001) types.push("ALIQUOTA");
  if (input.declaredService > 0 && !input.activityCode) types.push("ATIVIDADE");
  if (input.isEstimate) types.push("ESTIMATIVA");
  return [...new Set(types)];
}

export function buildExclusionExport(input: { taxpayerDocument: string; competence: string; reason: string; calendarRevenue: string; legalLimit: string }) {
  const clean = input.taxpayerDocument.replace(/\D/g, ""); if (![11, 14].includes(clean.length)) throw new TributarioS5Error("CPF/CNPJ inválido para o arquivo de preparação.");
  return ["CELERIFLOW_SN_EXCLUSAO_INTERNA_V1", clean, input.competence, input.calendarRevenue, input.legalLimit, input.reason.replace(/[\r\n|]/g, " ")].join("|");
}
