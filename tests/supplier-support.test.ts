import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSupplierIdentity, validateSubmittedSupplierDocument, validateSupplierIdentityDocument } from "../src/app/app-domain/cadastros/fornecedores/supplier-form";
import { buildSupplierWhere, parseSupplierFilters } from "../src/app/app-domain/cadastros/fornecedores/supplier-query";
import { buildSupplierCertificationCsv } from "../src/app/app-domain/cadastros/fornecedores/supplier-report";
import { certificationStatus } from "../src/app/app-domain/cadastros/fornecedores/supplier-utils";
import type { SupplierListItem } from "../src/app/app-domain/cadastros/fornecedores/supplier-types";

test("supplier form keeps PF and PJ identities mutually exclusive and validates the selected document", () => {
  const person = parseSupplierIdentity({ supplierType: "PF", personId: "person-1", companyId: "" });
  assert.deepEqual(person, { supplierType: "PF", personId: "person-1", companyId: null });
  assert.equal(validateSupplierIdentityDocument(person, { cpf: "529.982.247-25" }), "52998224725");

  assert.throws(
    () => parseSupplierIdentity({ supplierType: "PF", personId: "person-1", companyId: "company-1" }),
    /não aceita pessoa jurídica ou CNPJ/,
  );
  assert.throws(
    () => validateSupplierIdentityDocument(parseSupplierIdentity({ supplierType: "PJ", personId: "", companyId: "company-1" }), { cnpj: "00.000.000/0000-00" }),
    /CNPJ inválido/,
  );
  assert.throws(
    () => validateSubmittedSupplierDocument(person, { cnpj: "04.252.011/0001-10" }, "52998224725"),
    /pessoa física não aceita CNPJ/,
  );
  const company = parseSupplierIdentity({ supplierType: "PJ", personId: "", companyId: "company-1" });
  assert.throws(
    () => validateSubmittedSupplierDocument(company, { cpf: "529.982.247-25" }, "04252011000110"),
    /pessoa jurídica não aceita CPF/,
  );
});

test("supplier query combines canonical document search, ME/EPP, status, and certificate filters", () => {
  const filters = parseSupplierFilters({
    q: "12.345.678/0001-90",
    classification: "ME_EPP",
    status: "Ativo",
    certification: "VENCE_EM_BREVE",
    page: "3",
  });
  const where = JSON.stringify(buildSupplierWhere(filters, new Date("2026-09-01T12:00:00.000Z")));

  assert.equal(filters.page, 3);
  assert.match(where, /12345678000190/);
  assert.match(where, /"companyType":{"in":\["ME","EPP"\]\}/);
  assert.match(where, /"status":"Ativo"/);
  assert.match(where, /"certificationsValidUntil"/);
});

test("supplier certificate report derives validity without declaring regularity and protects CSV formulas", () => {
  assert.deepEqual(certificationStatus("2026-08-31", "2026-09-01"), { code: "VENCIDA", label: "Vencida em 31/08/2026" });
  assert.deepEqual(certificationStatus("2026-09-20", "2026-09-01"), { code: "VENCE_EM_BREVE", label: "Vence em 20/09/2026" });

  const supplier: SupplierListItem = {
    id: "supplier-1",
    category: "Materiais",
    businessBranch: "Papelaria",
    bankData: null,
    certificationsValidUntil: "2026-09-20",
    notes: null,
    status: "Ativo",
    person: null,
    company: {
      corporateName: "=FORNECEDOR DEMO",
      tradeName: null,
      cnpj: "04252011000110",
      companyType: "ME",
      primaryCnae: "4761-0/03 - Comércio de artigos de papelaria",
      secondaryCnaes: null,
      documents: [],
    },
  };
  const csv = buildSupplierCertificationCsv([supplier], new Date("2026-09-01T12:00:00.000Z"));
  assert.match(csv, /"'=FORNECEDOR DEMO"/);
  assert.match(csv, /"Vence em 20\/09\/2026"/);
});
