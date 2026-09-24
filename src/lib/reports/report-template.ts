import { createHash } from "node:crypto";
import { z } from "zod";

export const reportTemplateScope = "GLOBAL";
export const reportOrientations = ["PORTRAIT", "LANDSCAPE"] as const;
export type ReportOrientation = (typeof reportOrientations)[number];

export type ReportTemplateValues = {
  header: string;
  footer: string;
  orientation: ReportOrientation;
  includeEmissionMetadata: boolean;
};

export type ReportTemplatePresentation = ReportTemplateValues & {
  version: number;
  fingerprint: string;
};

export type ReportInstitutionIdentity = {
  name: string;
  legalName: string | null;
  cnpj: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
};

export type ReportEmissionMetadata = {
  issuedAt: string;
  issuedBy: string;
};

export const reportTemplateValuesSchema = z.object({
  header: z.string().trim().max(1_000),
  footer: z.string().trim().max(1_000),
  orientation: z.enum(reportOrientations),
  includeEmissionMetadata: z.boolean(),
}).strict();

export function createReportTemplateFingerprint(input: ReportTemplateValues & { version: number }) {
  return createHash("sha256")
    .update(JSON.stringify({
      version: input.version,
      header: input.header,
      footer: input.footer,
      orientation: input.orientation,
      includeEmissionMetadata: input.includeEmissionMetadata,
    }), "utf8")
    .digest("hex");
}

export function createDefaultReportTemplate(): ReportTemplatePresentation {
  const values: ReportTemplateValues = {
    header: "",
    footer: "",
    orientation: "LANDSCAPE",
    includeEmissionMetadata: true,
  };
  return { version: 1, ...values, fingerprint: createReportTemplateFingerprint({ version: 1, ...values }) };
}

type StoredReportTemplate = Omit<ReportTemplateValues, "orientation"> & {
  version: number;
  fingerprint: string;
  orientation: string;
};

export function createReportTemplatePresentation(template: StoredReportTemplate | null | undefined): ReportTemplatePresentation {
  if (!template) return createDefaultReportTemplate();
  const values = reportTemplateValuesSchema.parse({
    header: template.header,
    footer: template.footer,
    orientation: template.orientation,
    includeEmissionMetadata: template.includeEmissionMetadata,
  });
  return { version: template.version, fingerprint: template.fingerprint, ...values };
}
