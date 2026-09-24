import assert from "node:assert/strict";
import test from "node:test";
import { isPocVirtualBank, isPocVirtualBankAccount, pocVirtualBank } from "../src/lib/poc/poc-config.ts";

test("limits the São João do Ivaí POC to the Banco Virtual Robonuvem", () => {
  assert.equal(isPocVirtualBank(pocVirtualBank.name), true);
  assert.equal(isPocVirtualBank("001 - Banco do Brasil S.A."), false);
  assert.equal(isPocVirtualBank("104 - Caixa Econômica Federal"), false);
});

test("accepts only the accounts provisioned for the virtual bank", () => {
  assert.equal(isPocVirtualBankAccount("20001-1"), true);
  assert.equal(isPocVirtualBankAccount("98765-4"), false);
});
