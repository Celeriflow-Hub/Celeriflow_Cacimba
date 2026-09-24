export type PublicNoticeSource = {
  protocolNumber: string;
};

export function createPublicNoticeValidationCode() {
  return `CFN-${crypto.randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase()}`;
}

export function assertProcessNoticeCanBePublished(input: { status: string; isFromOmbudsman: boolean }) {
  if (input.isFromOmbudsman) {
    throw new Error("Processos originados na Ouvidoria não podem gerar aviso público sem classificação e aprovação institucional específicas.");
  }
  if (!["Concluido", "Concluído", "Arquivado"].includes(input.status)) {
    throw new Error("Somente processos concluídos ou arquivados podem gerar aviso público.");
  }
}

// Do not add source narrative, interested parties, document identifiers, or blob URLs here.
export function createRedactedProcessNotice(source: PublicNoticeSource) {
  return {
    title: `Aviso de processo ${source.protocolNumber}`,
    // Process type names can disclose a sensitive subject. Public process
    // notices use a deliberately generic label instead.
    category: "Processos e protocolos",
  };
}

export function projectPublicNotice(notice: {
  sourceModule?: string;
  title: string;
  category: string;
  publishedAt: Date;
  validationCode: string;
}) {
  return {
    title: notice.title,
    category: notice.sourceModule === "PROCESSOS" ? "Processos e protocolos" : notice.category,
    publishedAt: notice.publishedAt,
    validationUrl: `/validar-aviso/${notice.validationCode}`,
  };
}
