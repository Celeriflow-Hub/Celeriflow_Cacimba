import assert from "node:assert/strict";
import test from "node:test";
import { canIssueFinancialReports } from "../src/lib/financeiro/report-access";

function userWithPermissions(permissions: Record<string, unknown>) {
  return {
    role: "Operador Financeiro",
    permissions: JSON.stringify(permissions),
  };
}

test("only the explicit Financeiro report permission allows consolidated internal reports", () => {
  const basePermissions = {
    acesso: "operacional",
    modules: {
      FINANCEIRO: { showDashboardCard: true, blocked: false, create: true, update: true, delete: false },
    },
  };

  assert.equal(canIssueFinancialReports(userWithPermissions(basePermissions)), false);
  assert.equal(canIssueFinancialReports(userWithPermissions({
    ...basePermissions,
    modules: {
      FINANCEIRO: { ...basePermissions.modules.FINANCEIRO, issueReports: true },
    },
  })), true);
});

test("the report permission is independent from Financeiro CRUD access", () => {
  const user = userWithPermissions({
    acesso: "operacional",
    modules: {
      FINANCEIRO: { showDashboardCard: true, blocked: false, create: false, update: false, delete: false, issueReports: true },
    },
  });

  assert.equal(canIssueFinancialReports(user), true);
});

test("the system administrator retains report issuance access", () => {
  assert.equal(canIssueFinancialReports({
    profileCode: "SYSTEM_ADMINISTRATOR",
    permissions: JSON.stringify({ acesso: "operacional", modules: {} }),
  }), true);
});
