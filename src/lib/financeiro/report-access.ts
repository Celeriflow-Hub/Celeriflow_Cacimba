import { SYSTEM_ADMIN_PROFILE_CODE } from "@/lib/administration/c3-policy";

type FinancialReportAccessUser = {
  profileCode?: string | null;
  permissions?: string | null;
};

function parsePermissions(value: string | null | undefined) {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

export function canIssueFinancialReports(user: FinancialReportAccessUser) {
  const permissions = parsePermissions(user.permissions);
  if (user.profileCode === SYSTEM_ADMIN_PROFILE_CODE) return true;

  const modules = permissions?.modules;
  if (!modules || typeof modules !== "object" || Array.isArray(modules)) return false;
  const financeiro = (modules as Record<string, unknown>).FINANCEIRO;
  if (!financeiro || typeof financeiro !== "object" || Array.isArray(financeiro)) return false;

  const permission = financeiro as Record<string, unknown>;
  return permission.blocked !== true
    && permission.issueReports === true;
}
