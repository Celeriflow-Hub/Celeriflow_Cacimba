import PDFDocument from "pdfkit";

export type CdaPdf = {
  cdaNumber: string;
  version: number;
  annotation?: string | null;
  signatureStatus: string;
  debt: { origin: string; year: number; original: string; updated: string; status: string; enrolledAt: string };
  taxpayer: { name: string; document: string };
  institution: { name: string; cnpj: string; city: string; state: string };
  versions: { version: number; createdAt: string; signature: string }[];
  events: string[];
};

const brl = (value: string) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function renderCdaPdf(input: CdaPdf) {
  return new Promise<Uint8Array>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 18, info: { Title: `CDA ${input.cdaNumber} v${input.version}`, Author: input.institution.name } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(new Uint8Array(Buffer.concat(chunks))));
    doc.on("error", reject);
    const left = 18;
    const width = 559;
    const line = () => doc.moveTo(left, doc.y).lineTo(left + width, doc.y).strokeColor("#111827").lineWidth(0.6).stroke();
    const section = (title: string) => { line(); const y = doc.y + 2; doc.font("Helvetica-Bold").fontSize(9).fillColor("#111827").text(title.toUpperCase(), left + 3, y, { width: 553 }); doc.y = y + 12; };
    const row = (items: { label: string; value: string; width: number }[]) => {
      const y = doc.y + 2;
      doc.font("Helvetica-Bold").fontSize(6.5);
      const labelHeight = Math.max(...items.map((item) => doc.heightOfString(item.label, { width: item.width - 6 })));
      const valueY = y + labelHeight + 2;
      let x = left + 3;
      let height = labelHeight + 14;
      for (const item of items) {
        doc.font("Helvetica-Bold").fontSize(6.5).text(item.label, x, y, { width: item.width - 6 });
        doc.font("Helvetica").fontSize(8).text(item.value || "-", x, valueY, { width: item.width - 6 });
        height = Math.max(height, labelHeight + doc.heightOfString(item.value || "-", { width: item.width - 6 }) + 5);
        x += item.width;
      }
      doc.y = y + height;
    };
    doc.rect(8, 8, 579, 826).lineWidth(1).stroke("#111827");
    doc.font("Helvetica-Bold").fontSize(20).fillColor("#1d4ed8").text("CDA", left + 4, 18, { width: 100 });
    doc.fillColor("#111827").fontSize(12).text("Certidão de Dívida Ativa", 170, 18, { width: 220, align: "center" });
    doc.font("Helvetica-Bold").fontSize(9).text(input.institution.name.toUpperCase(), 400, 18, { width: 165, align: "right" });
    doc.font("Helvetica").fontSize(7).text([input.institution.cnpj, `${input.institution.city} - ${input.institution.state}`].filter(Boolean).join("\n"), 400, 30, { width: 165, align: "right" });
    doc.y = 64;
    line();
    section("Identificação");
    row([
      { label: "NÚMERO DA CDA", value: input.cdaNumber, width: 200 },
      { label: "VERSÃO", value: String(input.version), width: 100 },
      { label: "EXERCÍCIO", value: String(input.debt.year), width: 120 },
      { label: "SITUAÇÃO", value: input.debt.status, width: 139 },
    ]);
    section("Contribuinte");
    row([
      { label: "NOME / RAZÃO SOCIAL", value: input.taxpayer.name, width: 360 },
      { label: "CPF/CNPJ", value: input.taxpayer.document, width: 199 },
    ]);
    section("Crédito inscrito");
    row([
      { label: "ORIGEM", value: input.debt.origin, width: 200 },
      { label: "VALOR ORIGINAL", value: brl(input.debt.original), width: 120 },
      { label: "VALOR ATUALIZADO", value: brl(input.debt.updated), width: 120 },
      { label: "INSCRIÇÃO", value: input.debt.enrolledAt, width: 119 },
    ]);
    if (input.annotation) { section("Anotações"); doc.font("Helvetica").fontSize(8).text(input.annotation, left + 3, doc.y + 3, { width: 553 }); doc.y += 16; }
    section("Assinatura");
    row([{ label: "SITUAÇÃO DA ASSINATURA", value: input.signatureStatus === "ASSINATURA_INTERNA" ? "Assinatura interna registrada (certificação ICP-Brasil não configurada)" : "Não assinada", width: 559 }]);
    section("Histórico da dívida");
    doc.font("Helvetica").fontSize(7.5);
    for (const event of input.events.slice(0, 30)) doc.text(`• ${event}`, left + 3, doc.y + 2, { width: 553 });
    doc.y += 8;
    section("Versões");
    doc.font("Helvetica").fontSize(7.5);
    for (const version of input.versions) doc.text(`• v${version.version} — ${version.createdAt} — ${version.signature}`, left + 3, doc.y + 2, { width: 553 });
    doc.y += 8;
    line();
    doc.fontSize(6.5).fillColor("#475569").text("Documento interno gerado a partir dos registros do sistema. Sem presunção de certificação oficial ou protocolo externo.", left + 3, doc.y + 4, { width: 553 });
    doc.end();
  });
}
