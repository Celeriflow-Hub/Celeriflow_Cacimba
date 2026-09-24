const SENSITIVE_DISCLOSURE_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "CPF", pattern: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/ },
  { label: "CNPJ", pattern: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/ },
  { label: "e-mail", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
  { label: "telefone", pattern: /(?:\+55\s*)?(?:\(\d{2}\)\s*|\d{2}[\s-])?9?\d{4}[-\s]\d{4}\b/ },
  { label: "campo de identidade", pattern: /\b(?:cpf|cnpj|e-?mail|telefone|celular|whatsapp|endereço|endereco)\b/i },
];

export function assertRedactedOmbudsmanDisclosure(value: string) {
  const disclosure = value.trim();
  if (disclosure.length < 20) {
    throw new Error("O resumo autorizado precisa explicar o fato sem reproduzir dados pessoais ou a narrativa original.");
  }
  if (disclosure.length > 2_000) {
    throw new Error("O resumo autorizado excede o limite de 2.000 caracteres.");
  }

  const sensitive = SENSITIVE_DISCLOSURE_PATTERNS.find(({ pattern }) => pattern.test(disclosure));
  if (sensitive) {
    throw new Error(`O resumo autorizado não pode incluir ${sensitive.label}. Remova dados de identidade, contato e detalhes sigilosos.`);
  }

  return disclosure;
}
