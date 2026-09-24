"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { AccessError, getTenantContextForSystemAdministration } from "@/lib/platform/tenant-context";
import { normalizeRestrictiveProfilePermissions, SYSTEM_ADMIN_PROFILE_CODE } from "@/lib/administration/c3-policy";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";

const MODULE_CODES = new Set([
  "ADMINISTRACAO", "RH", "PORTAL_SERVIDOR", "CADASTROS", "ATENDIMENTO", "COMPRAS", "CONTRATOS", "FINANCEIRO", "PATRIMONIO", "TRIBUTACAO", "PROCESSOS", "SAUDE",
  "EDUCACAO", "SOCIAL", "FROTAS", "MEIO_AMBIENTE", "CAMARA", "TRANSPARENCIA", "CONFIGURACOES",
]);

function normalizePermissions(value: string | undefined) {
  return normalizeRestrictiveProfilePermissions(value, MODULE_CODES);
}

function createCustomProfileCode() {
  return `CUSTOM_${randomUUID().replaceAll("-", "")}`;
}

export async function upsertPerfil(data: {
  id?: string;
  nome: string;
  descricao: string;
  permissoes?: string;
  ativo: boolean;
}) {
  try {
    const context = await getTenantContextForSystemAdministration();
    const { prisma } = context;
    const nome = data.nome.trim();
    if (!nome) return { error: "Informe o nome do perfil." };

    let jsonPermissoes: string;
    try {
      jsonPermissoes = normalizePermissions(data.permissoes);
    } catch {
      return { error: "A matriz de permissões é inválida." };
    }

    const duplicate = await prisma.configuracaoPerfil.findFirst({
      where: {
        nome: { equals: nome, mode: "insensitive" },
        ...(data.id ? { NOT: { id: data.id } } : {}),
      },
      select: { id: true },
    });
    if (duplicate) return { error: "Já existe um perfil com este nome." };

    if (data.id) {
      const existing = await prisma.configuracaoPerfil.findUnique({ where: { id: data.id } });
      if (!existing) return { error: "Perfil não encontrado." };
      if (existing.codigo === SYSTEM_ADMIN_PROFILE_CODE) {
        return { error: "O perfil técnico do administrador do sistema é gerenciado automaticamente." };
      }
      
      await prisma.$transaction(async (tx) => {
        const profile = await tx.configuracaoPerfil.update({ where: { id: data.id }, data: { nome, descricao: data.descricao, permissoes: jsonPermissoes, ativo: data.ativo } });
        await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "PROFILE", targetId: profile.id });
      });
    } else {
      await prisma.$transaction(async (tx) => {
        const profile = await tx.configuracaoPerfil.create({ data: { codigo: createCustomProfileCode(), nome, descricao: data.descricao, permissoes: jsonPermissoes, ativo: data.ativo } });
        await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "PROFILE", targetId: profile.id });
      });
    }
    revalidatePermissionConsumers();
    return { error: null };
  } catch (error) {
    console.error(error);
    return { error: error instanceof AccessError ? error.message : "Não foi possível salvar o perfil. Tente novamente." };
  }
}

export async function togglePerfilStatus(id: string, ativo: boolean) {
  try {
    const context = await getTenantContextForSystemAdministration();
    const { prisma } = context;
    const perfil = await prisma.configuracaoPerfil.findUnique({ where: { id } });
    if (!perfil) return { error: "Perfil não encontrado." };
    if (perfil.codigo === SYSTEM_ADMIN_PROFILE_CODE) {
      return { error: "O perfil técnico do administrador do sistema é gerenciado automaticamente." };
    }
    await prisma.$transaction(async (tx) => {
      await tx.configuracaoPerfil.update({ where: { id }, data: { ativo } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "PROFILE", targetId: id });
    });
    revalidatePermissionConsumers();
    return { error: null };
  } catch (error) {
    console.error(error);
    return { error: error instanceof AccessError ? error.message : "Erro ao alterar o status do perfil." };
  }
}

export async function deletePerfil(id: string) {
  try {
    const context = await getTenantContextForSystemAdministration();
    const { prisma } = context;
    const perfil = await prisma.configuracaoPerfil.findUnique({ where: { id }, select: { id: true, codigo: true } });
    if (!perfil) return { error: "Perfil não encontrado." };
    if (perfil.codigo === SYSTEM_ADMIN_PROFILE_CODE) {
      return { error: "O perfil do administrador do sistema é protegido e não pode ser excluído." };
    }

    const linkedUsers = await prisma.usuario.count({ where: { perfilId: id } });
    if (linkedUsers > 0) {
      return { error: `Não é possível excluir este perfil porque há ${linkedUsers} usuário(s) vinculado(s). Reatribua ou exclua os usuários antes.` };
    }

    await prisma.$transaction(async (tx) => {
      await tx.configuracaoPerfil.delete({ where: { id } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "PROFILE", targetId: id });
    });
    revalidatePermissionConsumers();
    return { error: null };
  } catch (error) {
    console.error(error);
    return { error: error instanceof AccessError ? error.message : "Não foi possível excluir o perfil. Tente novamente." };
  }
}

function revalidatePermissionConsumers() {
  revalidatePath("/configuracoes/perfis");
  revalidatePath("/configuracoes/usuarios");
  revalidatePath("/configuracoes");
  revalidatePath("/dashboard");
  revalidatePath("/app-domain/dashboard");
  revalidatePath("/");
}

