import { get, put } from "@vercel/blob";
import { getCeleriFlowInstanceId } from "@/lib/platform/instance";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

function getBlobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN nao configurada.");
  return token;
}

function safeFilename(filename: string) {
  const normalized = filename.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const sanitized = normalized.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return sanitized.slice(0, 120) || "arquivo";
}

export function getBlobDocumentPrefix() {
  return `instances/${getCeleriFlowInstanceId()}/documents/`;
}

export function isInstanceDocumentPath(pathname: string) {
  return pathname.startsWith(getBlobDocumentPrefix());
}

// Tipos de arquivo aceitos para upload na plataforma
const ALLOWED_MIME_TYPES = new Set([
  // Documentos
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.oasis.opendocument.text",
  // Planilhas
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.spreadsheet",
  // Apresentações
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Imagens
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  // Compactados
  "application/zip",
  "application/x-rar-compressed",
  // Texto
  "text/plain",
  "text/csv",
]);

const PROCESS_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

export function validateUpload(file: File) {
  if (!file.name || file.size === 0) throw new Error("Selecione um arquivo valido.");
  if (file.size > MAX_FILE_SIZE_BYTES) throw new Error("O arquivo deve ter no maximo 20 MB.");
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(
      "Tipo de arquivo nao permitido. Envie PDF, documentos Office, imagens ou planilhas."
    );
  }
}


export async function uploadFile(file: File) {
  validateUpload(file);

  return put(`${getBlobDocumentPrefix()}${crypto.randomUUID()}-${safeFilename(file.name)}`, file, {
    access: "private",
    token: getBlobToken(),
  });
}

export async function uploadProcessFile(file: File) {
  if (!file.name || file.size === 0) throw new Error("Selecione um arquivo valido.");
  if (file.size > 10 * 1024 * 1024) throw new Error("O anexo do processo deve ter no maximo 10 MB.");
  if (!PROCESS_ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Envie apenas arquivos PDF, JPG ou PNG.");
  }

  return put(`${getBlobDocumentPrefix()}processos/${crypto.randomUUID()}-${safeFilename(file.name)}`, file, {
    access: "private",
    token: getBlobToken(),
  });
}

// Generated public reports are stored as the exact CSV that was issued internally.
export async function uploadGeneratedReport(filename: string, csv: string) {
  return put(`${getBlobDocumentPrefix()}relatorios/${crypto.randomUUID()}-${safeFilename(filename)}`, csv, {
    access: "private",
    contentType: "text/csv; charset=utf-8",
    token: getBlobToken(),
  });
}

export async function uploadGeneratedFinancialFile(filename: string, content: string | Uint8Array, contentType: string) {
  const body = typeof content === "string" ? content : Buffer.from(content);
  return put(`${getBlobDocumentPrefix()}financeiro/${crypto.randomUUID()}-${safeFilename(filename)}`, body, {
    access: "private",
    contentType,
    token: getBlobToken(),
  });
}

// Bank statements are preserved exactly as received for audit and reconciliation evidence.
export async function archiveBankStatement(filename: string, content: string, contentType: string) {
  return put(`${getBlobDocumentPrefix()}extratos/${crypto.randomUUID()}-${safeFilename(filename)}`, content, {
    access: "private",
    contentType,
    token: getBlobToken(),
  });
}

export async function getFile(url: string) {
  try {
    const file = await get(url, { access: "private", token: getBlobToken() });
    return file && isInstanceDocumentPath(file.blob.pathname) ? file : null;
  } catch {
    return null;
  }
}

export function downloadFilename(pathname: string) {
  return safeFilename(pathname.split("/").pop() || "documento");
}
