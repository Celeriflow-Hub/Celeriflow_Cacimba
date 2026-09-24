import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getIdTokenPrincipal, getSessionPrincipal, SESSION_COOKIE_NAME, type SessionPrincipal } from "@/lib/platform/session";
import type { PrismaClient } from "@prisma/client";
import { isSystemAdministratorEmail, SYSTEM_ADMIN_PROFILE_CODE } from "@/lib/administration/c3-policy";
import { getCurrentHealthUnitIds } from "@/lib/saude/health-access-policy";

export { canIssueFinancialReports } from "@/lib/financeiro/report-access";

// Compatibility layer for the existing module pages and Server Actions.
// Access is resolved from the municipal database, which is the only active
// application database.

export class AccessError extends Error {
  constructor(message: string, readonly status: 401 | 403 | 404 | 423) {
    super(message);
  }
}

export type AppContext = {
  user: {
    id: string;
    firebaseUid: string;
    email: string;
    name: string;
    role: string;
    profileCode: string;
    permissions?: string | null;
    modulePermissions: { code: string; canView: boolean; canEdit: boolean }[];
    allowedBudgetUnitIds: string[];
    allowedHealthUnitIds?: string[];
    hasHealthAccessScope?: boolean;
    employeeId: string | null;
    departmentId: string | null;
    secretariatId: string | null;
  };
  prisma: PrismaClient;
};

type RolePermissions = {
  acesso?: unknown;
  modulosBloqueados?: unknown;
  modulosPermitidos?: unknown;
  modulosSomenteLeitura?: unknown;
  modules?: unknown;
};

type ModuleProfilePermission = {
  showDashboardCard: boolean;
  blocked: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  issueReports: boolean;
};

export type ModuleOperation = "create" | "update" | "delete" | "issueReports";

function parseRolePermissions(value: string | null | undefined): RolePermissions | null {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as RolePermissions) : null;
  } catch {
    return null;
  }
}

function hasModuleAccess(values: unknown, moduleCode: string) {
  return Array.isArray(values) && values.some((value) => value === moduleCode);
}

// During the demonstration, the employee and patient portals are open to every
// authenticated profile. The active module configuration remains the
// system-wide availability boundary; administrative permissions are not
// changed by this exception.
const OPEN_TO_AUTHENTICATED_PROFILES = new Set(["PORTAL_SERVIDOR", "PORTAL_PACIENTE"]);

function isOpenToAuthenticatedProfiles(moduleCode: string) {
  return OPEN_TO_AUTHENTICATED_PROFILES.has(moduleCode.toUpperCase());
}

function getModuleProfilePermission(rolePermissions: RolePermissions | null, moduleCode: string): ModuleProfilePermission | null {
  if (!rolePermissions?.modules || typeof rolePermissions.modules !== "object" || Array.isArray(rolePermissions.modules)) return null;
  const raw = (rolePermissions.modules as Record<string, unknown>)[moduleCode];
  // A granular profile is deny-by-default. Per-user module rows can narrow,
  // but cannot grant access beyond this profile baseline.
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { showDashboardCard: false, blocked: true, create: false, update: false, delete: false, issueReports: false };
  }
  const permission = raw as Partial<ModuleProfilePermission>;
  return {
    showDashboardCard: permission.showDashboardCard === true,
    blocked: permission.blocked === true,
    create: permission.create === true,
    update: permission.update === true,
    delete: permission.delete === true,
    issueReports: permission.issueReports === true,
  };
}

export function isModuleBlockedForUser(user: AppContext["user"], moduleCode: string) {
  if (isOpenToAuthenticatedProfiles(moduleCode)) return false;
  if (isSystemAdministrator(user)) return false;
  const codeUpper = moduleCode.toUpperCase();
  const rolePermissions = parseRolePermissions(user.permissions);
  const permission = getModuleProfilePermission(rolePermissions, codeUpper);
  return permission ? permission.blocked : hasModuleAccess(rolePermissions?.modulosBloqueados, codeUpper);
}

export function canShowDashboardCard(user: AppContext["user"], moduleCode: string) {
  if (isOpenToAuthenticatedProfiles(moduleCode)) return true;
  if (isSystemAdministrator(user)) return true;

  const codeUpper = moduleCode.toUpperCase();
  const rolePermissions = parseRolePermissions(user.permissions);
  const permission = getModuleProfilePermission(rolePermissions, codeUpper);
  if (permission) return permission.showDashboardCard;
  return canViewModule(user, codeUpper);
}

export function canViewModule(user: AppContext["user"], moduleCode: string) {
  if (isOpenToAuthenticatedProfiles(moduleCode)) return true;
  if (isSystemAdministrator(user)) return true;

  const codeUpper = moduleCode.toUpperCase();
  const rolePermissions = parseRolePermissions(user.permissions);
  const permission = getModuleProfilePermission(rolePermissions, codeUpper);
  if (permission) {
    if (permission.blocked) return false;
    const individualPermissionsExist = user.modulePermissions.length > 0;
    return !individualPermissionsExist || user.modulePermissions.some((item) => item.code === codeUpper && (item.canView || item.canEdit));
  }
  if (hasModuleAccess(rolePermissions?.modulosBloqueados, codeUpper)) return false;

  const allowedModules = rolePermissions?.modulosPermitidos;
  if (Array.isArray(allowedModules)) return hasModuleAccess(allowedModules, codeUpper);

  return user.modulePermissions.some(
    (permission) => permission.code === codeUpper && (permission.canView || permission.canEdit),
  );
}

export function canEditModule(user: AppContext["user"], moduleCode: string) {
  if (isSystemAdministrator(user)) return true;

  const codeUpper = moduleCode.toUpperCase();
  const rolePermissions = parseRolePermissions(user.permissions);
  const permission = getModuleProfilePermission(rolePermissions, codeUpper);
  if (permission) {
    if (permission.blocked || !(permission.create || permission.update || permission.delete)) return false;
    const individualPermissionsExist = user.modulePermissions.length > 0;
    return !individualPermissionsExist || user.modulePermissions.some((item) => item.code === codeUpper && item.canEdit);
  }
  if (hasModuleAccess(rolePermissions?.modulosBloqueados, codeUpper)) return false;
  if (hasModuleAccess(rolePermissions?.modulosSomenteLeitura, codeUpper)) return false;

  const allowedModules = rolePermissions?.modulosPermitidos;
  if (Array.isArray(allowedModules) && !hasModuleAccess(allowedModules, codeUpper)) return false;

  return user.modulePermissions.some(
    (permission) => permission.code === codeUpper && permission.canEdit,
  );
}

export function canPerformModuleOperation(
  user: AppContext["user"],
  moduleCode: string,
  operation: ModuleOperation,
) {
  if (isSystemAdministrator(user)) return true;

  const codeUpper = moduleCode.toUpperCase();
  const rolePermissions = parseRolePermissions(user.permissions);
  const permission = getModuleProfilePermission(rolePermissions, codeUpper);
  if (permission) {
    if (permission.blocked || !permission[operation]) return false;
    const individualPermissionsExist = user.modulePermissions.length > 0;
    return !individualPermissionsExist || user.modulePermissions.some((item) => item.code === codeUpper && item.canEdit);
  }

  // Profiles created before the granular matrix keep their existing CRUD access.
  // Report issuance remains opt-in because legacy profiles never stored it safely.
  return operation === "issueReports" ? false : canEditModule(user, codeUpper);
}

export function isSystemAdministrator(user: AppContext["user"]) {
  return user.profileCode === SYSTEM_ADMIN_PROFILE_CODE;
}

export function isModuleActive(active: boolean | undefined) {
  return active !== false;
}

export function isPocEvaluator(user: AppContext["user"]) {
  return user.role.startsWith("POC Avaliador");
}

export function canUseInactiveModule(user: AppContext["user"]) {
  // São João do Ivaí evaluators remain limited to the modules enabled for the POC.
  return !isPocEvaluator(user);
}

export function assertBudgetUnitAccess(user: AppContext["user"], budgetUnitId: string) {
  if (isSystemAdministrator(user)) return;
  if (!user.allowedBudgetUnitIds.includes(budgetUnitId)) {
    throw new AccessError(`Acesso negado à Unidade Gestora ${budgetUnitId}.`, 403);
  }
}

export function assertHealthUnitAccess(user: AppContext["user"], healthUnitId: string) {
  if (isSystemAdministrator(user) || !user.hasHealthAccessScope) return;
  if (!user.allowedHealthUnitIds?.includes(healthUnitId)) {
    throw new AccessError("Acesso negado à unidade de saúde selecionada.", 403);
  }
}

async function resolveUser(principal: SessionPrincipal | null): Promise<AppContext["user"]> {
  if (!principal) throw new AccessError("Sessao invalida ou expirada.", 401);

  let usuario;
  let allowedBudgetUnitIds: string[] = [];

  try {
    usuario = await prisma.usuario.findUnique({
      where: { firebaseUid: principal.firebaseUid },
      include: {
        perfil: true,
        employee: true,
        permissoesModulo: {
          include: { modulo: { select: { codigo: true } } },
        },
        unidadesGestoras: {
          select: { budgetUnitId: true },
        },
        healthAccessScopes: true,
      },
    });
    if (usuario?.unidadesGestoras) {
      allowedBudgetUnitIds = usuario.unidadesGestoras.map((ug) => ug.budgetUnitId);
    }
  } catch {
    // Fallback if UsuarioUnidadeGestora table does not exist yet in DB migration
    usuario = await prisma.usuario.findUnique({
      where: { firebaseUid: principal.firebaseUid },
      include: {
        perfil: true,
        employee: true,
        permissoesModulo: {
          include: { modulo: { select: { codigo: true } } },
        },
        healthAccessScopes: true,
      },
    });
  }

  // The configured technical administrator is always repaired to the protected
  // profile after Firebase has verified the identity, even if a stale row exists.
  if (isSystemAdministratorEmail(principal.email)) {
    const profile = await prisma.configuracaoPerfil.upsert({
      where: { codigo: SYSTEM_ADMIN_PROFILE_CODE },
      create: {
        id: "system-administrator",
        codigo: SYSTEM_ADMIN_PROFILE_CODE,
        nome: "Administrador",
        descricao: "Acesso administrativo inicial do sistema.",
        permissoes: JSON.stringify({ acesso: "total" }),
        ativo: true,
      },
      update: {
        codigo: SYSTEM_ADMIN_PROFILE_CODE,
        nome: "Administrador",
        descricao: "Acesso administrativo inicial do sistema.",
        permissoes: JSON.stringify({ acesso: "total" }),
        ativo: true,
      },
    });

    usuario = await prisma.usuario.upsert({
      where: { email: principal.email },
      create: {
        nome: principal.name,
        email: principal.email,
        senha: "firebase",
        firebaseUid: principal.firebaseUid,
        ativo: true,
        perfilId: profile.id,
      },
      update: {
        nome: principal.name,
        firebaseUid: principal.firebaseUid,
        ativo: true,
        perfilId: profile.id,
      },
      include: {
        perfil: true,
        employee: true,
        permissoesModulo: {
          include: { modulo: { select: { codigo: true } } },
        },
        unidadesGestoras: {
          select: { budgetUnitId: true },
        },
        healthAccessScopes: true,
      },
    });
    allowedBudgetUnitIds = usuario.unidadesGestoras.map((ug) => ug.budgetUnitId);
  }

  if (!usuario || !usuario.ativo || !usuario.perfil.ativo) {
    throw new AccessError("Usuario sem acesso ao sistema.", 403);
  }

  const healthAccessScopes = usuario.healthAccessScopes ?? [];
  const allowedHealthUnitIds = getCurrentHealthUnitIds(healthAccessScopes);

  return {
    id: usuario.id,
    firebaseUid: principal.firebaseUid,
    email: usuario.email,
    name: usuario.nome || principal.name,
    role: usuario.perfil.nome,
    profileCode: usuario.perfil.codigo,
    permissions: usuario.perfil.permissoes ?? null,
    modulePermissions: usuario.permissoesModulo.map((permission) => ({
      code: permission.modulo.codigo.toUpperCase(),
      canView: permission.canView,
      canEdit: permission.canEdit,
    })),
    allowedBudgetUnitIds,
    allowedHealthUnitIds,
    hasHealthAccessScope: healthAccessScopes.length > 0,
    employeeId: usuario.employee?.id ?? null,
    departmentId: usuario.employee?.departmentId ?? null,
    secretariatId: usuario.employee?.secretariatId ?? null,
  };
}

function buildAppContext(user: AppContext["user"]): AppContext {
  return {
    user,
    prisma,
  };
}

export async function getCurrentTenantContext(): Promise<AppContext> {
  const cookieStore = await cookies();
  const principal = await getSessionPrincipal(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  return buildAppContext(await resolveUser(principal));
}

export async function authorizeIdToken(idToken: string): Promise<AppContext["user"]> {
  return resolveUser(await getIdTokenPrincipal(idToken));
}

export async function getTenantContextForSystemAdministration(): Promise<AppContext> {
  const context = await getCurrentTenantContext();
  if (!isSystemAdministrator(context.user)) {
    throw new AccessError("Apenas o administrador do sistema pode gerenciar usuários, perfis e módulos.", 403);
  }
  return context;
}

// Enforces granular module RBAC based on user profile permissions.
export async function getTenantContextForModule(moduleCode: string): Promise<AppContext> {
  const context = await getCurrentTenantContext();
  const codeUpper = moduleCode.toUpperCase();
  const moduleConfig = await context.prisma.configuracaoModulo.findUnique({
    where: { codigo: codeUpper },
    select: { ativo: true },
  });
  if (moduleConfig && !moduleConfig.ativo && !canUseInactiveModule(context.user)) {
    throw new AccessError(`O módulo ${moduleCode} está inativo nesta instância.`, 423);
  }
  if (!canViewModule(context.user, codeUpper)) {
    throw new AccessError(`Acesso negado ao módulo ${moduleCode}.`, 403);
  }
  if (codeUpper === "SAUDE" && context.user.hasHealthAccessScope && !context.user.allowedHealthUnitIds?.length) {
    throw new AccessError("Acesso à Saúde fora da vigência, dia ou horário autorizado.", 403);
  }

  return context;
}

export async function getTenantContextForModuleEdit(moduleCode: string): Promise<AppContext> {
  const context = await getTenantContextForModule(moduleCode);
  if (!canEditModule(context.user, moduleCode)) {
    throw new AccessError(`Acesso de edição negado ao módulo ${moduleCode}.`, 403);
  }
  return context;
}

export async function getTenantContextForModuleOperation(
  moduleCode: string,
  operation: ModuleOperation,
): Promise<AppContext> {
  const context = await getTenantContextForModule(moduleCode);
  if (!canPerformModuleOperation(context.user, moduleCode, operation)) {
    throw new AccessError(`Acesso negado para ${operation} no módulo ${moduleCode}.`, 403);
  }
  return context;
}

export async function getOptionalTenantContext(): Promise<AppContext | null> {
  try {
    return await getCurrentTenantContext();
  } catch (error) {
    if (error instanceof AccessError) return null;
    throw error;
  }
}
