"use server";

import { revalidatePath } from "next/cache";
import { getTenantContextForModuleOperation, type ModuleOperation } from "@/lib/platform/tenant-context";
import { z } from "zod";
import { nextYearlyCode } from "@/lib/sequence";
import type { SegMobFormData, SegMobKind } from "./types";

async function getTenantPrisma(operation: ModuleOperation) {
  return (await getTenantContextForModuleOperation("SEGURANCA", operation)).prisma;
}

const kindSchema = z.enum(["guarda", "ocorrencia", "infracao", "registro"]);
const formSchema = z.object({
  code: z.string().trim().max(80),
  title: z.string().trim().min(1).max(500),
  type: z.string().trim().min(1).max(120),
  status: z.string().trim().min(1).max(80),
  isActive: z.boolean(),
  date: z.string().optional(),
  value: z.number().finite().nonnegative().optional(),
});

const modulePaths = [
  "/app-domain/seguranca",
  "/app-domain/seguranca/guardas",
  "/app-domain/seguranca/ocorrencias",
  "/app-domain/seguranca/infracoes",
  "/app-domain/seguranca/rondas",
  "/app-domain/seguranca/defesa-civil",
  "/app-domain/seguranca/transito",
  "/app-domain/seguranca/mobilidade",
  "/app-domain/seguranca/ordens",
  "/app-domain/seguranca/documentos",
];

function revalidateSegMob() {
  for (const path of modulePaths) revalidatePath(path);
}

function clean(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseDate(value?: string) {
  return value ? new Date(value) : new Date();
}

function validateInput(kind: SegMobKind, data: SegMobFormData, id?: string) {
  if (!kindSchema.safeParse(kind).success) return "Tipo de registro invalido.";
  if (id && !z.string().cuid().safeParse(id).success) return "Identificador invalido.";
  if (!formSchema.safeParse(data).success || (id && !data.code.trim())) return "Preencha os campos obrigatorios com valores validos.";
  if (data.date && Number.isNaN(new Date(data.date).getTime())) return "Data invalida.";
  return null;
}

async function nextSecurityCode(kind: SegMobKind) {
  const prisma = await getTenantPrisma("create");
  if (kind === "guarda") {
    const items = await prisma.segurancaGuarda.findMany({ select: { matricula: true } });
    return nextYearlyCode({ prisma, key: "seguranca-guarda", prefix: "GCM", existingCodes: items.map(({ matricula }) => ({ code: matricula })) });
  }
  if (kind === "ocorrencia") {
    const items = await prisma.segurancaOcorrencia.findMany({ select: { numero: true } });
    return nextYearlyCode({ prisma, key: "seguranca-ocorrencia", prefix: "OC", existingCodes: items.map(({ numero }) => ({ code: numero })) });
  }
  if (kind === "infracao") {
    const items = await prisma.segurancaInfracao.findMany({ select: { auto: true } });
    return nextYearlyCode({ prisma, key: "seguranca-infracao", prefix: "AIT", existingCodes: items.map(({ auto }) => ({ code: auto })) });
  }
  const items = await prisma.segurancaMobilidadeRegistro.findMany({ select: { codigo: true } });
  return nextYearlyCode({ prisma, key: "seguranca-registro", prefix: "SEG", existingCodes: items.map(({ codigo }) => ({ code: codigo })) });
}

export async function createSegMobItem(kind: SegMobKind, data: SegMobFormData) {
  const prisma = await getTenantPrisma("create");
  if (!kindSchema.safeParse(kind).success) return { error: "Tipo de registro invalido." };
  if (!data.code.trim()) data = { ...data, code: await nextSecurityCode(kind) };
  const error = validateInput(kind, data);
  if (error) return { error };

  try {
    if (kind === "guarda") {
      await prisma.segurancaGuarda.create({
        data: {
          matricula: data.code.trim(),
          nome: data.title.trim(),
          tipo: data.type || "Guarda Municipal",
          equipe: clean(data.location),
          status: data.status || "Ativo",
          isActive: data.isActive,
        },
      });
    }

    if (kind === "ocorrencia") {
      await prisma.segurancaOcorrencia.create({
        data: {
          numero: data.code.trim(),
          tipo: data.type || "Ocorrencia Administrativa",
          descricao: data.description?.trim() || data.title.trim(),
          local: clean(data.location),
          bairro: clean(data.district),
          prioridade: data.priority || "Normal",
          status: data.status || "Registrada",
          isActive: data.isActive,
        },
      });
    }

    if (kind === "infracao") {
      await prisma.segurancaInfracao.create({
        data: {
          auto: data.code.trim(),
          data: parseDate(data.date),
          placa: data.plate?.trim() || data.title.trim(),
          tipo: data.type || "Infracao de Transito",
          local: data.location?.trim() || "Nao informado",
          valor: data.value ?? null,
          status: data.status || "Registrado",
          isActive: data.isActive,
        },
      });
    }

    if (kind === "registro") {
      await prisma.segurancaMobilidadeRegistro.create({
        data: {
          codigo: data.code.trim(),
          categoria: data.category || "Registro Operacional",
          tipo: data.type || "Atividade",
          titulo: data.title.trim(),
          descricao: clean(data.description),
          local: clean(data.location),
          bairro: clean(data.district),
          responsavel: clean(data.responsible),
          prioridade: data.priority || "Normal",
          status: data.status || "Ativo",
          dataInicio: parseDate(data.date),
          valor: data.value ?? null,
          placa: clean(data.plate),
          relatedModule: clean(data.relatedModule),
          relatedId: clean(data.relatedId),
          isActive: data.isActive,
        },
      });
    }

    revalidateSegMob();
    return { error: null };
  } catch (error) {
    console.error(error);
    return { error: "Nao foi possivel criar o registro. Verifique se o codigo ja existe." };
  }
}

export async function updateSegMobItem(kind: SegMobKind, id: string, data: SegMobFormData) {
  const prisma = await getTenantPrisma("update");
  const error = validateInput(kind, data, id);
  if (error) return { error };

  try {
    if (kind === "guarda") {
      await prisma.segurancaGuarda.update({
        where: { id },
        data: {
          matricula: data.code.trim(),
          nome: data.title.trim(),
          tipo: data.type || "Guarda Municipal",
          equipe: clean(data.location),
          status: data.status || "Ativo",
          isActive: data.isActive,
        },
      });
    }

    if (kind === "ocorrencia") {
      await prisma.segurancaOcorrencia.update({
        where: { id },
        data: {
          numero: data.code.trim(),
          tipo: data.type || "Ocorrencia Administrativa",
          descricao: data.description?.trim() || data.title.trim(),
          local: clean(data.location),
          bairro: clean(data.district),
          prioridade: data.priority || "Normal",
          status: data.status || "Registrada",
          isActive: data.isActive,
        },
      });
    }

    if (kind === "infracao") {
      await prisma.segurancaInfracao.update({
        where: { id },
        data: {
          auto: data.code.trim(),
          data: parseDate(data.date),
          placa: data.plate?.trim() || data.title.trim(),
          tipo: data.type || "Infracao de Transito",
          local: data.location?.trim() || "Nao informado",
          valor: data.value ?? null,
          status: data.status || "Registrado",
          isActive: data.isActive,
        },
      });
    }

    if (kind === "registro") {
      await prisma.segurancaMobilidadeRegistro.update({
        where: { id },
        data: {
          codigo: data.code.trim(),
          categoria: data.category || "Registro Operacional",
          tipo: data.type || "Atividade",
          titulo: data.title.trim(),
          descricao: clean(data.description),
          local: clean(data.location),
          bairro: clean(data.district),
          responsavel: clean(data.responsible),
          prioridade: data.priority || "Normal",
          status: data.status || "Ativo",
          dataInicio: parseDate(data.date),
          valor: data.value ?? null,
          placa: clean(data.plate),
          relatedModule: clean(data.relatedModule),
          relatedId: clean(data.relatedId),
          isActive: data.isActive,
        },
      });
    }

    revalidateSegMob();
    return { error: null };
  } catch (error) {
    console.error(error);
    return { error: "Nao foi possivel salvar o registro. Verifique os dados informados." };
  }
}

export async function toggleSegMobItemStatus(kind: SegMobKind, id: string, isActive: boolean) {
  const prisma = await getTenantPrisma("update");
  if (!kindSchema.safeParse(kind).success || !z.string().cuid().safeParse(id).success || typeof isActive !== "boolean") {
    return { error: "Dados invalidos para alterar o status." };
  }
  try {
    if (kind === "guarda") await prisma.segurancaGuarda.update({ where: { id }, data: { isActive } });
    if (kind === "ocorrencia") await prisma.segurancaOcorrencia.update({ where: { id }, data: { isActive } });
    if (kind === "infracao") await prisma.segurancaInfracao.update({ where: { id }, data: { isActive } });
    if (kind === "registro") await prisma.segurancaMobilidadeRegistro.update({ where: { id }, data: { isActive } });

    revalidateSegMob();
    return { error: null };
  } catch (error) {
    console.error(error);
    return { error: "Nao foi possivel alterar o status do registro." };
  }
}
