export interface PocConfig {
  enabled: boolean;
  environmentName: string;
  watermarkText: string;
  notificationSandbox: boolean;
  lastResetAt: string | null;
}

// The São João do Ivaí demonstration uses only this external test bank.
export const pocVirtualBank = {
  name: "001 - Banco Virtual Robonuvem",
  agency: "0001",
  accountNumbers: [
    "10001-0", "20001-1", "10003-3", "10004-4", "10005-5", "10006-6", "10007-7", "10008-8",
    "10009-9", "10010-0", "10011-1", "10012-2", "10013-3", "10014-4", "10015-5", "10016-6",
    "10017-7", "10018-8", "10019-9", "10020-0", "90001-4", "90002-5", "90003-6", "90004-7",
  ],
  baseUrl: "https://banco-virtual-robonuvem.vercel.app/api/bank",
} as const;

export function isPocVirtualBank(bankName: string | null | undefined) {
  return bankName === pocVirtualBank.name;
}

export function isPocVirtualBankAccount(accountNumber: string | null | undefined) {
  return Boolean(accountNumber && pocVirtualBank.accountNumbers.includes(accountNumber as (typeof pocVirtualBank.accountNumbers)[number]));
}

export function pocBankAccountExternalId(accountNumber: string) {
  const index = pocVirtualBank.accountNumbers.indexOf(accountNumber as (typeof pocVirtualBank.accountNumbers)[number]);
  return index >= 0 ? `BA-${String(index + 1).padStart(3, "0")}` : null;
}

export const defaultPocConfig: PocConfig = {
  enabled: true,
  environmentName: "Demonstração & POC",
  watermarkText: "DOCUMENTO DE DEMONSTRAÇÃO - CELERIFLOW POC",
  notificationSandbox: true,
  lastResetAt: null,
};

export function isPocModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_POC_MODE === "true" || process.env.NODE_ENV !== "production";
}
