import assert from "node:assert/strict";
import test from "node:test";
import { getInstanceConfigurationDefaults, parseInstanceConfigurationValues } from "@/lib/platform/instance-configuration";

test("returns reusable defaults for every supported instance parameter", () => {
  assert.deepEqual(getInstanceConfigurationDefaults(), {
    WORKFLOW_DEFAULT_SLA_DAYS: 5,
    WORKFLOW_INSTANCE_TIME_ZONE: "America/Sao_Paulo",
    DOCUMENT_DEFAULT_RETENTION_MONTHS: 60,
    NOTIFICATION_DEFAULT_PRIORITY: "NORMAL",
    REPORT_INCLUDE_EMISSION_METADATA: true,
  });
});

test("accepts only valid operational instance parameter values", () => {
  assert.deepEqual(parseInstanceConfigurationValues({
    WORKFLOW_DEFAULT_SLA_DAYS: "15",
    WORKFLOW_INSTANCE_TIME_ZONE: "America/Manaus",
    DOCUMENT_DEFAULT_RETENTION_MONTHS: "120",
    NOTIFICATION_DEFAULT_PRIORITY: "ALTA",
    REPORT_INCLUDE_EMISSION_METADATA: false,
  }), {
    WORKFLOW_DEFAULT_SLA_DAYS: 15,
    WORKFLOW_INSTANCE_TIME_ZONE: "America/Manaus",
    DOCUMENT_DEFAULT_RETENTION_MONTHS: 120,
    NOTIFICATION_DEFAULT_PRIORITY: "ALTA",
    REPORT_INCLUDE_EMISSION_METADATA: false,
  });
});

test("rejects unsupported keys and unsafe parameter ranges", () => {
  assert.throws(() => parseInstanceConfigurationValues({
    WORKFLOW_DEFAULT_SLA_DAYS: 0,
    WORKFLOW_INSTANCE_TIME_ZONE: "America/Sao_Paulo",
    DOCUMENT_DEFAULT_RETENTION_MONTHS: 60,
    NOTIFICATION_DEFAULT_PRIORITY: "NORMAL",
    REPORT_INCLUDE_EMISSION_METADATA: true,
  }));
  assert.throws(() => parseInstanceConfigurationValues({
    WORKFLOW_DEFAULT_SLA_DAYS: 5,
    WORKFLOW_INSTANCE_TIME_ZONE: "America/Sao_Paulo",
    DOCUMENT_DEFAULT_RETENTION_MONTHS: 60,
    NOTIFICATION_DEFAULT_PRIORITY: "NORMAL",
    REPORT_INCLUDE_EMISSION_METADATA: true,
    MUNICIPIO_FIXO: "Divino de São Lourenço",
  }));
});
