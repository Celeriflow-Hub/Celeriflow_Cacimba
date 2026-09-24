import { requireValidCep, requireValidCnpj } from "@/lib/identifiers/brazilian-identifiers";

export const SYSTEM_ADMIN_PROFILE_CODE = "SYSTEM_ADMINISTRATOR";
export const DEFAULT_SYSTEM_ADMIN_EMAIL = "admin@email.com";

export function getSystemAdministratorEmail() {
  return process.env.SYSTEM_ADMIN_EMAIL?.trim().toLowerCase() || DEFAULT_SYSTEM_ADMIN_EMAIL;
}

export function isSystemAdministratorEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() === getSystemAdministratorEmail();
}

export type EmployeeHierarchyInput = {
  requestedSecretariatId: string | null;
  department: { id: string; secretariatId: string; isActive: boolean } | null;
  secretariat: { id: string; isActive: boolean } | null;
  unit: { id: string; secretariatId: string; isActive: boolean } | null;
};

export function normalizeOptionalInstitutionIdentifiers(input: { cnpj?: string | null; zipCode?: string | null }) {
  const cnpj = input.cnpj?.trim() || null;
  const zipCode = input.zipCode?.trim() || null;
  return {
    cnpj: cnpj ? requireValidCnpj(cnpj) : null,
    zipCode: zipCode ? requireValidCep(zipCode) : null,
  };
}

export function isSystemAdministratorProfileCode(code: string | null | undefined) {
  return code === SYSTEM_ADMIN_PROFILE_CODE;
}

export function normalizeRestrictiveProfilePermissions(value: string | undefined, moduleCodes: ReadonlySet<string>) {
  if (!value) return JSON.stringify({ acesso: "operacional", modules: {} });
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("A matriz de permissões é inválida.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("A matriz de permissões é inválida.");

  const source = parsed as { modules?: unknown };
  const modulesSource = source.modules && typeof source.modules === "object" && !Array.isArray(source.modules)
    ? source.modules as Record<string, unknown>
    : {};
  const modules: Record<string, { showDashboardCard: boolean; blocked: boolean; create: boolean; update: boolean; delete: boolean; issueReports: boolean }> = {};

  for (const [code, raw] of Object.entries(modulesSource)) {
    if (!moduleCodes.has(code) || !raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const item = raw as Record<string, unknown>;
    const blocked = item.blocked === true;
    const isHiddenCard = code === "CADASTROS" || code === "ATENDIMENTO";
    modules[code] = {
      showDashboardCard: isHiddenCard ? false : item.showDashboardCard === true,
      blocked,
      create: !blocked && item.create === true,
      update: !blocked && item.update === true,
      delete: !blocked && item.delete === true,
      issueReports: !blocked && item.issueReports === true,
    };
  }

  return JSON.stringify({
    acesso: "operacional",
    modules,
    modulosBloqueados: Object.entries(modules).filter(([, permission]) => permission.blocked).map(([code]) => code),
  });
}

export function resolveEmployeeHierarchy(input: EmployeeHierarchyInput) {
  if (input.department && !input.department.isActive) throw new Error("O departamento selecionado está inativo.");
  if (input.secretariat && !input.secretariat.isActive) throw new Error("A secretaria selecionada está inativa.");
  if (input.unit && !input.unit.isActive) throw new Error("A unidade administrativa selecionada está inativa.");

  const secretariatId = input.department?.secretariatId ?? input.requestedSecretariatId;
  if (input.department && input.requestedSecretariatId && input.requestedSecretariatId !== input.department.secretariatId) {
    throw new Error("A secretaria do servidor é determinada pelo departamento selecionado.");
  }
  if (input.unit && secretariatId && input.unit.secretariatId !== secretariatId) {
    throw new Error("A unidade administrativa deve pertencer à secretaria do servidor.");
  }
  return { secretariatId };
}

export function assertLifecycleCanDeactivate(input: { entity: string; activeChildrenOrReferences: number }) {
  if (input.activeChildrenOrReferences > 0) {
    throw new Error(`Não é possível inativar ${input.entity} enquanto houver vínculos ativos.`);
  }
}

export function assertAdministratorLifecycleChange(input: {
  actorUsuarioId: string;
  targetUsuarioId: string;
  targetIsSystemAdministrator: boolean;
  targetWillBeSystemAdministrator: boolean;
  targetWillBeActive: boolean;
  activeSystemAdministratorCount: number;
}) {
  const removesAdministrator = input.targetIsSystemAdministrator && (!input.targetWillBeSystemAdministrator || !input.targetWillBeActive);
  if (input.actorUsuarioId === input.targetUsuarioId && removesAdministrator) {
    throw new Error("Você não pode remover seu próprio acesso de administrador do sistema.");
  }
  if (removesAdministrator && input.activeSystemAdministratorCount <= 1) {
    throw new Error("O último administrador do sistema não pode ser desativado ou rebaixado.");
  }
}
