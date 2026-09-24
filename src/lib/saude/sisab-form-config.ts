// Esquemas configuráveis das fichas e-SUS. Uma única central renderiza,
// valida e exporta todas as fichas; nenhuma página por ficha.
export type EsusFieldType = "text" | "date" | "number" | "boolean" | "select";
export type EsusField = { key: string; label: string; type: EsusFieldType; required?: boolean; options?: string[] };

const TURNO: EsusField = { key: "turno", label: "Turno", type: "select", required: true, options: ["Manhã", "Tarde", "Noite"] };
const DESFECHO_ATEND: EsusField = { key: "desfecho", label: "Desfecho", type: "select", required: true, options: ["Alta", "Retorno", "Encaminhamento", "Óbito", "Evasão"] };

export const ESUS_FORM_SCHEMAS: Record<string, EsusField[]> = {
  INDIVIDUAL: [
    TURNO,
    { key: "peso", label: "Peso (kg)", type: "number" },
    { key: "altura", label: "Altura (m)", type: "number" },
    { key: "aleitamento", label: "Aleitamento", type: "select", options: ["Exclusivo", "Misto", "Ausente", "Não se aplica"] },
    { key: "dum", label: "DUM", type: "date" },
    { key: "idadeGestacional", label: "Idade gestacional (semanas)", type: "number" },
    { key: "gestanteRisco", label: "Gestante de risco", type: "boolean" },
    { key: "ciap", label: "CIAP", type: "text" },
    { key: "cid", label: "CID", type: "text" },
    { key: "condicoes", label: "Condições", type: "text" },
    DESFECHO_ATEND,
  ],
  DOMICILIAR: [
    { key: "moradores", label: "Moradores", type: "number", required: true },
    { key: "comodos", label: "Cômodos", type: "number" },
    { key: "renda", label: "Renda familiar (salários)", type: "text" },
    { key: "abastecimentoAgua", label: "Abastecimento de água", type: "select", options: ["Rede pública", "Poço", "Outros"] },
    { key: "observacoes", label: "Observações", type: "text" },
  ],
  VISITA: [
    TURNO,
    { key: "desfechoVisita", label: "Desfecho", type: "select", required: true, options: ["Realizada", "Recusada", "Ausente"] },
    { key: "motivoFalta", label: "Motivo da falta/recusa", type: "text" },
    { key: "condicoes", label: "Condições observadas", type: "text" },
  ],
  ATENDIMENTO_INDIVIDUAL: [
    { key: "local", label: "Local", type: "select", required: true, options: ["UBS", "Domicílio", "Escola", "Outros"] },
    { key: "tipoConsulta", label: "Tipo de consulta", type: "select", required: true, options: ["Demanda espontânea", "Agendada", "Retorno"] },
    TURNO,
    { key: "racionalidade", label: "Racionalidade", type: "text" },
    { key: "evolucao", label: "Evolução", type: "text" },
    { key: "ciap", label: "CIAP", type: "text" },
    { key: "cid", label: "CID", type: "text" },
    { key: "rastreamento", label: "Rastreamento", type: "text" },
    { key: "conduta", label: "Conduta", type: "text" },
    DESFECHO_ATEND,
    { key: "observacao", label: "Observação", type: "text" },
  ],
  ODONTO: [
    { key: "tipoAtendimento", label: "Tipo de atendimento", type: "select", required: true, options: ["Primeira consulta", "Retorno", "Urgência", "Manutenção"] },
    TURNO,
    { key: "gestante", label: "Gestante", type: "boolean" },
    { key: "necessidadesEspeciais", label: "Necessidades especiais", type: "text" },
    { key: "vigilanciaBucal", label: "Vigilância em saúde bucal", type: "text" },
    { key: "procedimentos", label: "Procedimentos realizados", type: "text" },
    { key: "fornecimento", label: "Materiais fornecidos", type: "text" },
    { key: "desfecho", label: "Desfecho", type: "select", required: true, options: ["Tratamento concluído", "Retorno", "Encaminhamento", "Abandono"] },
  ],
  ATIVIDADE_COLETIVA: [
    TURNO,
    { key: "local", label: "Local", type: "text", required: true },
    { key: "inep", label: "INEP da escola", type: "text" },
    { key: "tipoAtividade", label: "Tipo de atividade", type: "select", required: true, options: ["Educação em saúde", "Atendimento em grupo", "Avaliação", "Outros"] },
    { key: "temas", label: "Temas", type: "text" },
    { key: "publicoAlvo", label: "Público-alvo", type: "text" },
    { key: "praticas", label: "Práticas em saúde", type: "text" },
    { key: "participantes", label: "Participantes", type: "number", required: true },
    { key: "pesoAltura", label: "Peso/altura coletados", type: "boolean" },
    { key: "profissionais", label: "Profissionais participantes", type: "text" },
    { key: "responsavel", label: "Responsável", type: "text", required: true },
  ],
  PROCEDIMENTOS: [
    TURNO,
    { key: "procedimentos", label: "Procedimentos (códigos)", type: "text", required: true },
    { key: "observacao", label: "Observação", type: "text" },
  ],
  CONSUMO_ALIMENTAR: [
    { key: "data", label: "Data", type: "date", required: true },
    { key: "local", label: "Local", type: "select", required: true, options: ["Domicílio", "UBS", "Escola", "Outros"] },
    { key: "refeicao", label: "Refeição", type: "select", required: true, options: ["Café da manhã", "Almoço", "Lanche", "Jantar"] },
    { key: "faixaEtaria", label: "Faixa etária", type: "select", required: true, options: ["Criança", "Adolescente", "Adulto", "Idoso", "Gestante"] },
    { key: "observacao", label: "Observação", type: "text" },
  ],
  ATENDIMENTO_DOMICILIAR: [
    { key: "elegivel", label: "Elegível para AD", type: "select", required: true, options: ["Sim", "Não"] },
    { key: "data", label: "Data", type: "date", required: true },
    TURNO,
    { key: "procedencia", label: "Procedência", type: "select", options: ["UBS", "Hospital", "Urgência", "Demanda espontânea"] },
    { key: "condicoes", label: "Condições", type: "text" },
    { key: "cids", label: "CIDs", type: "text" },
    { key: "cuidador", label: "Cuidador", type: "text" },
    { key: "referencia", label: "Referência", type: "text" },
  ],
  OUTRO: [{ key: "observacao", label: "Observação", type: "text" }],
};

export function validateEsusFields(kind: string, fields: Record<string, unknown>): string | null {
  const schema = ESUS_FORM_SCHEMAS[kind];
  if (!schema) return `Tipo de ficha desconhecido: ${kind}.`;
  for (const field of schema) {
    const value = fields[field.key];
    const empty = value === undefined || value === null || value === "";
    if (field.required && empty) return `Campo obrigatório da ficha: ${field.label}.`;
    if (!empty && field.type === "number" && Number.isNaN(Number(value))) return `Campo numérico inválido: ${field.label}.`;
    if (!empty && field.type === "select" && field.options && !field.options.includes(String(value))) return `Opção inválida em ${field.label}.`;
  }
  if (kind === "ATIVIDADE_COLETIVA" && fields["pesoAltura"] === true && (fields["participantes"] === undefined || fields["participantes"] === "")) return "Atividade com antropometria exige o número de participantes.";
  return null;
}
