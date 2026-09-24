import { PrismaClient, Prisma } from "@prisma/client";

export interface CadUnicoQueryResult {
  nis: string;
  cpf: string;
  nomeCompleto: string;
  rendaPerCapita: number;
  composicaoFamiliar: number;
  municipio: string;
  uf: string;
  statusCadastral: string;
  elegivelBolsaFamilia: boolean;
  elegivelBPC: boolean;
}

export async function queryCadUnicoMds(
  prisma: PrismaClient,
  searchNisOrCpf: string
): Promise<CadUnicoQueryResult> {
  const cleanSearch = searchNisOrCpf.replace(/\D/g, "");

  let record = await prisma.cadUnicoRecord.findFirst({
    where: {
      OR: [{ nis: cleanSearch }, { cpf: cleanSearch }, { nis: searchNisOrCpf }, { cpf: searchNisOrCpf }],
    },
  });

  if (!record) {
    // Seed automático de demonstração se não encontrar no mock local
    const nisVal = cleanSearch.length === 11 ? cleanSearch : `123${Math.floor(10000000 + Math.random() * 90000000)}`;
    const cpfVal = cleanSearch.length === 11 ? cleanSearch : `089${Math.floor(10000000 + Math.random() * 90000000)}`;

    record = await prisma.cadUnicoRecord.create({
      data: {
        nis: nisVal,
        cpf: cpfVal,
        nomeCompleto: "MARIA DAS DORES DA SILVA",
        rendaPerCapita: new Prisma.Decimal(218.0),
        composicaoFamiliar: 4,
        endereco: "RUA PRINCIPAL, 100 - CENTRO",
        municipio: "MUNICÍPIO MODELO",
        uf: "PB",
        statusCadastral: "ATUALIZADO",
      },
    });
  }

  const renda = Number(record.rendaPerCapita);

  return {
    nis: record.nis,
    cpf: record.cpf,
    nomeCompleto: record.nomeCompleto,
    rendaPerCapita: renda,
    composicaoFamiliar: record.composicaoFamiliar,
    municipio: record.municipio,
    uf: record.uf,
    statusCadastral: record.statusCadastral,
    elegivelBolsaFamilia: renda <= 218.0,
    elegivelBPC: renda <= 353.0,
  };
}

export async function createSuasRmaRecord(
  prisma: PrismaClient,
  data: {
    nis: string;
    nomeCidadao: string;
    unidadeAtendimento: string;
    tipoAtendimento: string;
    detalhesRma: string;
    tecnicoResponsavel: string;
  }
) {
  return await prisma.suasProntuarioRma.create({
    data: {
      nis: data.nis,
      nomeCidadao: data.nomeCidadao,
      unidadeAtendimento: data.unidadeAtendimento,
      tipoAtendimento: data.tipoAtendimento,
      detalhesRma: data.detalhesRma,
      tecnicoResponsavel: data.tecnicoResponsavel,
      status: "FINALIZADO",
    },
  });
}
