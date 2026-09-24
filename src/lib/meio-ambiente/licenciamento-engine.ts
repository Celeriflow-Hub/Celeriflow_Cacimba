import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

export interface EnvironmentalLicenseInput {
  numeroProcesso: string;
  tipoLicenca: "LP - Licença Prévia" | "LI - Licença de Instalação" | "LO - Licença de Operação";
  requerenteNome: string;
  requerenteCnpjCpf: string;
  atividade: string;
  enderecoEmpreendimento: string;
  validadeMeses: number;
}

export interface EnvironmentalLicenseResult {
  id: string;
  numeroLicenca: string;
  tipoLicenca: string;
  requerenteNome: string;
  hashSHA256: string;
  qrCodeValidationUrl: string;
  validadeData: Date;
  status: string;
}

export async function generateEnvironmentalLicense(
  prisma: PrismaClient,
  input: EnvironmentalLicenseInput
): Promise<EnvironmentalLicenseResult> {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  const numeroLicenca = `LIC-AMB-${input.tipoLicenca.slice(0, 2)}-${year}-${random}`;

  const validadeData = new Date();
  validadeData.setMonth(validadeData.getMonth() + (input.validadeMeses || 12));

  const payload = `${numeroLicenca}:${input.numeroProcesso}:${input.requerenteCnpjCpf}:${validadeData.toISOString()}`;
  const hashSHA256 = crypto.createHash("sha256").update(payload).digest("hex");
  const qrCodeValidationUrl = `https://celeriflow.gov.br/validar-licenca?hash=${hashSHA256}&licenca=${numeroLicenca}`;

  const record = await prisma.environmentalLicense.create({
    data: {
      numeroProcesso: input.numeroProcesso,
      numeroLicenca,
      tipoLicenca: input.tipoLicenca,
      requerenteNome: input.requerenteNome,
      requerenteCnpjCpf: input.requerenteCnpjCpf,
      atividade: input.atividade,
      enderecoEmpreendimento: input.enderecoEmpreendimento,
      validadeData,
      status: "EMITIDA",
      hashSHA256,
      qrCodeValidationUrl,
    },
  });

  return {
    id: record.id,
    numeroLicenca: record.numeroLicenca,
    tipoLicenca: record.tipoLicenca,
    requerenteNome: record.requerenteNome,
    hashSHA256: record.hashSHA256,
    qrCodeValidationUrl: record.qrCodeValidationUrl,
    validadeData: record.validadeData,
    status: record.status,
  };
}
