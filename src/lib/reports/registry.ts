import { financeInternalReportDefinition, financeInternalReportKey } from "@/lib/financeiro/report-definition";

export const reportDefinitions = {
  [financeInternalReportKey]: financeInternalReportDefinition,
} as const;

export type RegisteredReportKey = keyof typeof reportDefinitions;

export function getRegisteredReportDefinition<Key extends RegisteredReportKey>(key: Key) {
  return reportDefinitions[key];
}
