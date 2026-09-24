import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import type { SegurancaGuarda, SegurancaInfracao, SegurancaMobilidadeRegistro, SegurancaOcorrencia } from "@prisma/client";
import type { SegMobItem } from "./types";

async function getTenantPrisma() {
  return (await getTenantContextForModule("SEGURANCA")).prisma;
}

export function mapGuarda(item: SegurancaGuarda): SegMobItem {
  return {
    id: item.id,
    kind: "guarda",
    code: item.matricula,
    title: item.nome,
    type: item.tipo,
    status: item.status,
    isActive: item.isActive,
    location: item.equipe,
    date: item.createdAt,
  };
}

export function mapOcorrencia(item: SegurancaOcorrencia): SegMobItem {
  return {
    id: item.id,
    kind: "ocorrencia",
    code: item.numero,
    title: item.descricao,
    type: item.tipo,
    status: item.status,
    isActive: item.isActive,
    location: item.local,
    district: item.bairro,
    priority: item.prioridade,
    description: item.descricao,
    date: item.createdAt,
  };
}

export function mapInfracao(item: SegurancaInfracao): SegMobItem {
  return {
    id: item.id,
    kind: "infracao",
    code: item.auto,
    title: item.placa,
    type: item.tipo,
    status: item.status,
    isActive: item.isActive,
    location: item.local,
    date: item.data,
    plate: item.placa,
    value: item.valor,
  };
}

export function mapRegistro(item: SegurancaMobilidadeRegistro): SegMobItem {
  return {
    id: item.id,
    kind: "registro",
    code: item.codigo,
    title: item.titulo,
    type: item.tipo,
    status: item.status,
    isActive: item.isActive,
    location: item.local,
    district: item.bairro,
    responsible: item.responsavel,
    priority: item.prioridade,
    date: item.dataInicio,
    description: item.descricao,
    plate: item.placa,
    value: item.valor,
    category: item.categoria,
    relatedModule: item.relatedModule,
    relatedId: item.relatedId,
  };
}

export async function getRegistrosByCategorias(categories: string[]) {
  const prisma = await getTenantPrisma();
  const records = await prisma.segurancaMobilidadeRegistro.findMany({
    where: { categoria: { in: categories } },
    orderBy: { createdAt: "desc" },
  });
  return records.map(mapRegistro);
}
