import assert from "node:assert/strict";
import test from "node:test";
import { assertRedactedOmbudsmanDisclosure } from "../ombudsman-disclosure-policy";

test("authorized Ombudsman summary rejects direct identifiers before a process is created", () => {
  assert.equal(
    assertRedactedOmbudsmanDisclosure("Apurar a regularidade do atendimento relatado e registrar a decisão administrativa."),
    "Apurar a regularidade do atendimento relatado e registrar a decisão administrativa.",
  );

  for (const value of [
    "Apurar relato informado pelo CPF 123.456.789-09 na unidade responsável.",
    "Apurar relato enviado por contato@exemplo.gov.br e registrar a decisão.",
    "Apurar manifestação com telefone (28) 99999-0000 e encaminhar providência.",
    "Apurar manifestação que menciona endereço da pessoa denunciante.",
  ]) {
    assert.throws(() => assertRedactedOmbudsmanDisclosure(value));
  }
});
