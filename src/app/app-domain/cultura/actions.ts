"use server";

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getTenantContextForModuleOperation, type ModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";

async function getTenantPrisma(operation: ModuleOperation) {
  return (await getTenantContextForModuleOperation("CULTURA", operation)).prisma;
}

type ActionResult = { error?: string };

const text = z.string().trim().min(1, "Campo obrigatório.");
const agentTypes = ["Artista Individual", "Grupo Cultural", "Produtor", "Coletivo"] as const;
const spaceTypes = ["Centro Cultural", "Quadra", "Teatro", "Praça", "Biblioteca"] as const;

function databaseError(error: unknown, fallback: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return "Já existe um registro com esses dados.";
  return fallback;
}

function revalidate(path: string) {
  revalidatePath(path);
  revalidatePath("/cultura");
}

export async function createAgente(data: { nome: string; tipo: string; segmento: string; personId?: string; companyId?: string }): Promise<ActionResult> {
  const prisma = await getTenantPrisma("create");
  const parsed = z.object({ nome: text, tipo: z.enum(agentTypes), segmento: text, personId: z.string().trim().optional(), companyId: z.string().trim().optional() }).safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (Boolean(parsed.data.personId) === Boolean(parsed.data.companyId)) return { error: "Vincule o agente a uma pessoa ou empresa do Cadastro Geral." };
  const [person, company] = await Promise.all([
    parsed.data.personId ? prisma.person.findUnique({ where: { id: parsed.data.personId }, select: { id: true, cpf: true, phonePrimary: true, email: true } }) : null,
    parsed.data.companyId ? prisma.company.findUnique({ where: { id: parsed.data.companyId }, select: { id: true, cnpj: true, emailPrimary: true } }) : null,
  ]);
  if ((parsed.data.personId && !person) || (parsed.data.companyId && !company)) return { error: "Cadastro Geral não encontrado." };
  try {
    await prisma.culturaAgente.create({ data: { nome: parsed.data.nome, tipo: parsed.data.tipo, segmento: parsed.data.segmento, cpfCnpj: person?.cpf ?? company?.cnpj, telefone: person?.phonePrimary, email: person?.email ?? company?.emailPrimary, personId: person?.id, companyId: company?.id } });
  } catch (error) {
    return { error: databaseError(error, "Não foi possível cadastrar o agente cultural.") };
  }
  revalidate("/cultura/gestao-cultural");
  return {};
}

export async function inactivateAgente(id: string): Promise<ActionResult> {
  const prisma = await getTenantPrisma("update");
  if (!text.safeParse(id).success) return { error: "Agente inválido." };
  try { await prisma.culturaAgente.update({ where: { id }, data: { active: false, status: "Inativo" } }); }
  catch (error) { return { error: databaseError(error, "Não foi possível inativar o agente.") }; }
  revalidate("/cultura/gestao-cultural");
  return {};
}

export async function createEspaco(data: { nome: string; tipo: string; capacidade?: number; realEstateId?: string; assetId?: string; responsibleEmployeeId?: string }): Promise<ActionResult> {
  const prisma = await getTenantPrisma("create");
  const parsed = z.object({ nome: text, tipo: z.enum(spaceTypes), capacidade: z.number().int().positive().optional(), realEstateId: z.string().trim().optional(), assetId: z.string().trim().optional(), responsibleEmployeeId: z.string().trim().optional() }).safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const [property, asset, employee] = await Promise.all([
    parsed.data.realEstateId ? prisma.realEstate.findUnique({ where: { id: parsed.data.realEstateId }, select: { id: true } }) : null,
    parsed.data.assetId ? prisma.asset.findUnique({ where: { id: parsed.data.assetId }, select: { id: true, status: true } }) : null,
    parsed.data.responsibleEmployeeId ? prisma.employee.findFirst({ where: { id: parsed.data.responsibleEmployeeId, isActive: true }, select: { id: true } }) : null,
  ]);
  if ((parsed.data.realEstateId && !property) || (parsed.data.assetId && (!asset || asset.status === "Baixado" || asset.status === "Inativo")) || (parsed.data.responsibleEmployeeId && !employee)) return { error: "Uma das referências informadas não está disponível." };
  try {
    await prisma.culturaEspaco.create({ data: { nome: parsed.data.nome, tipo: parsed.data.tipo, capacidade: parsed.data.capacidade, realEstateId: property?.id, assetId: asset?.id, responsibleEmployeeId: employee?.id } });
  } catch (error) { return { error: databaseError(error, "Não foi possível cadastrar o espaço.") }; }
  revalidate("/cultura/gestao-cultural");
  revalidate("/cultura/espacos-reservas");
  return {};
}

export async function inactivateEspaco(id: string): Promise<ActionResult> {
  const prisma = await getTenantPrisma("update");
  if (!text.safeParse(id).success) return { error: "Espaço inválido." };
  const hasFutureReservation = await prisma.culturaReserva.findFirst({ where: { spaceId: id, active: true, status: "Aprovada", endsAt: { gt: new Date() } }, select: { id: true } });
  if (hasFutureReservation) return { error: "Não é possível inativar um espaço com reserva aprovada futura." };
  try { await prisma.culturaEspaco.update({ where: { id }, data: { active: false, status: "Indisponível" } }); }
  catch (error) { return { error: databaseError(error, "Não foi possível inativar o espaço.") }; }
  revalidate("/cultura/gestao-cultural");
  revalidate("/cultura/espacos-reservas");
  return {};
}

export async function createEvento(data: { nome: string; tipo: string; startsAt: string; endsAt?: string; spaceId?: string; responsibleEmployeeId?: string; projectId?: string; publicoAlvo?: string }): Promise<ActionResult> {
  const prisma = await getTenantPrisma("create");
  const parsed = z.object({ nome: text, tipo: text, startsAt: text, endsAt: z.string().trim().optional(), spaceId: z.string().trim().optional(), responsibleEmployeeId: z.string().trim().optional(), projectId: z.string().trim().optional(), publicoAlvo: z.string().trim().optional() }).safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = parsed.data.endsAt ? new Date(parsed.data.endsAt) : null;
  if (Number.isNaN(startsAt.getTime()) || (endsAt && (Number.isNaN(endsAt.getTime()) || endsAt <= startsAt))) return { error: "Informe um período válido para o evento." };
  const [space, employee, project] = await Promise.all([
    parsed.data.spaceId ? prisma.culturaEspaco.findFirst({ where: { id: parsed.data.spaceId, active: true }, select: { id: true } }) : null,
    parsed.data.responsibleEmployeeId ? prisma.employee.findFirst({ where: { id: parsed.data.responsibleEmployeeId, isActive: true }, select: { id: true } }) : null,
    parsed.data.projectId ? prisma.culturaProjeto.findFirst({ where: { id: parsed.data.projectId, active: true }, select: { id: true } }) : null,
  ]);
  if ((parsed.data.spaceId && !space) || (parsed.data.responsibleEmployeeId && !employee) || (parsed.data.projectId && !project)) return { error: "Uma das referências informadas não está disponível." };
  try {
    await prisma.culturaEvento.create({ data: { nome: parsed.data.nome, tipo: parsed.data.tipo, data: startsAt, startsAt, endsAt, spaceId: space?.id, responsibleEmployeeId: employee?.id, projectId: project?.id, publicoAlvo: parsed.data.publicoAlvo || null, local: null } });
  } catch (error) { return { error: databaseError(error, "Não foi possível cadastrar o evento.") }; }
  revalidate("/cultura/eventos");
  return {};
}

export async function cancelEvento(id: string): Promise<ActionResult> {
  const prisma = await getTenantPrisma("update");
  if (!text.safeParse(id).success) return { error: "Evento inválido." };
  try { await prisma.culturaEvento.update({ where: { id }, data: { status: "Cancelado", active: false } }); }
  catch (error) { return { error: databaseError(error, "Não foi possível cancelar o evento.") }; }
  revalidate("/cultura/eventos");
  return {};
}

export async function createReserva(data: { spaceId: string; personId?: string; companyId?: string; eventId?: string; startsAt: string; endsAt: string; purpose: string }): Promise<ActionResult> {
  const prisma = await getTenantPrisma("create");
  const parsed = z.object({ spaceId: text, personId: z.string().trim().optional(), companyId: z.string().trim().optional(), eventId: z.string().trim().optional(), startsAt: text, endsAt: text, purpose: text }).safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (Boolean(parsed.data.personId) === Boolean(parsed.data.companyId)) return { error: "Informe uma pessoa ou empresa solicitante." };
  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) return { error: "Informe um período de reserva válido." };
  const [space, person, company, event] = await Promise.all([
    prisma.culturaEspaco.findFirst({ where: { id: parsed.data.spaceId, active: true, status: "Disponível" }, select: { id: true } }),
    parsed.data.personId ? prisma.person.findUnique({ where: { id: parsed.data.personId }, select: { id: true } }) : null,
    parsed.data.companyId ? prisma.company.findUnique({ where: { id: parsed.data.companyId }, select: { id: true } }) : null,
    parsed.data.eventId ? prisma.culturaEvento.findFirst({ where: { id: parsed.data.eventId, active: true }, select: { id: true } }) : null,
  ]);
  if (!space || (parsed.data.personId && !person) || (parsed.data.companyId && !company) || (parsed.data.eventId && !event)) return { error: "Uma das referências informadas não está disponível." };
  const conflict = await prisma.culturaReserva.findFirst({ where: { spaceId: space.id, active: true, status: { in: ["Solicitada", "Aprovada"] }, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } }, select: { id: true } });
  if (conflict) return { error: "Já existe uma reserva para este espaço no período informado." };
  try { await prisma.culturaReserva.create({ data: { spaceId: space.id, personId: person?.id, companyId: company?.id, eventId: event?.id, startsAt, endsAt, purpose: parsed.data.purpose } }); }
  catch (error) { return { error: databaseError(error, "Não foi possível solicitar a reserva.") }; }
  revalidate("/cultura/espacos-reservas");
  return {};
}
