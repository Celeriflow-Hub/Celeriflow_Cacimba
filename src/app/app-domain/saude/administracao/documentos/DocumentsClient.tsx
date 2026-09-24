"use client";

import { startTransition, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { Eye, FileSignature, Plus, Upload } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ErpStatusBadge, ErpTableContainer, ErpTableTd, ErpTableTh, ErpTableThead, ErpTableTr } from "@/components/app-ui/erp/ErpTable";
import { saveHealthStandardDocument, signHealthStandardDocument } from "./actions";

export type HealthDocumentRow = {
  id: string;
  documentId: string;
  title: string;
  category: string;
  moduleCode: string;
  fileUrl: string;
  status: string;
  createdAt: string;
  addedBy: string;
  versions: { id: string; versionNumber: number; fileUrl: string; status: string; finalizedAt: string; publicValidationCode: string | null }[];
  signatures: { id: string; signerName: string; status: string; signedAt: string | null; provider: string; verificationCode: string; metadata: string | null }[];
};

type ModuleOption = { code: string; name: string };

function signaturePosition(metadata: string | null) {
  if (!metadata) return "Não informada";
  try {
    const value = JSON.parse(metadata) as { page?: number; position?: string };
    const labels: Record<string, string> = { INFERIOR_DIREITA: "Inferior direita", INFERIOR_ESQUERDA: "Inferior esquerda", SUPERIOR_DIREITA: "Superior direita", SUPERIOR_ESQUERDA: "Superior esquerda" };
    return `Página ${value.page || 1} · ${labels[value.position || ""] || "posição registrada"}`;
  } catch {
    return "Não informada";
  }
}

export function DocumentsClient({ rows, modules, canCreate, canUpdate }: { rows: HealthDocumentRow[]; modules: ModuleOption[]; canCreate: boolean; canUpdate: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [detail, setDetail] = useState<HealthDocumentRow | null>(null);
  const [signatureDocument, setSignatureDocument] = useState<HealthDocumentRow | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Procedimento");
  const [moduleCode, setModuleCode] = useState("SAUDE");
  const [page, setPage] = useState(1);
  const [position, setPosition] = useState("INFERIOR_DIREITA");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return setMessage("Selecione um arquivo PDF.");
    setPending(true);
    setMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/saude/documentos/upload", { method: "POST", body });
      const stored = await response.json() as { url?: string; error?: string };
      if (!response.ok || !stored.url) throw new Error(stored.error || "Não foi possível armazenar o arquivo.");
      const result = await saveHealthStandardDocument({ title, category, moduleCode, fileUrl: stored.url });
      if ("error" in result) throw new Error(result.error);
      setUploadOpen(false);
      setTitle("");
      setMessage("Documento salvo.");
      startTransition(() => router.refresh());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o documento.");
    } finally {
      setPending(false);
    }
  }

  async function sign() {
    if (!signatureDocument || !password) return;
    setPending(true);
    setMessage("");
    try {
      const user = auth.currentUser;
      if (!user?.email) throw new Error("Sua sessão não está disponível. Entre novamente no sistema.");
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
      const token = await user.getIdToken(true);
      const result = await signHealthStandardDocument({ documentId: signatureDocument.documentId, page, position, reauthenticationToken: token });
      if ("error" in result) throw new Error(result.error);
      setSignatureDocument(null);
      setPassword("");
      setMessage("Assinatura eletrônica registrada.");
      startTransition(() => router.refresh());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível registrar a assinatura.");
    } finally {
      setPending(false);
    }
  }

  return <>
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 p-2">
        <span className="text-[11px] font-medium text-slate-500">{rows.length} registro(s) nesta página</span>
        {canCreate && <button type="button" onClick={() => { setMessage(""); setUploadOpen(true); }} className="inline-flex h-8 items-center gap-1.5 rounded bg-emerald-700 px-3 text-xs font-bold text-white"><Plus className="size-3.5" />Novo documento</button>}
      </div>
      <ErpTableContainer className="overflow-y-auto overflow-x-hidden">
        <ErpTableThead><ErpTableTr><ErpTableTh>Documento</ErpTableTh><ErpTableTh className="hidden w-[16%] md:table-cell">Categoria</ErpTableTh><ErpTableTh className="hidden w-[14%] lg:table-cell">Módulo</ErpTableTh><ErpTableTh className="w-[15%]">Situação</ErpTableTh><ErpTableTh className="w-[90px] text-center">Ações</ErpTableTh></ErpTableTr></ErpTableThead>
        <tbody>{rows.map(row => <ErpTableTr key={row.id}><ErpTableTd>{row.title}</ErpTableTd><ErpTableTd className="hidden md:table-cell">{row.category}</ErpTableTd><ErpTableTd className="hidden lg:table-cell">{row.moduleCode}</ErpTableTd><ErpTableTd><ErpStatusBadge variant={row.status === "Assinado" ? "success" : row.status === "Pendente Assinatura" ? "warning" : "info"}>{row.status}</ErpStatusBadge></ErpTableTd><ErpTableTd className="text-center"><div className="flex justify-center gap-1"><button type="button" onClick={() => setDetail(row)} aria-label={`Visualizar ${row.title}`} className="inline-flex size-7 items-center justify-center rounded border border-slate-200"><Eye className="size-3.5" /></button>{canUpdate && row.status !== "Assinado" && <button type="button" onClick={() => { setMessage(""); setSignatureDocument(row); }} aria-label={`Assinar ${row.title}`} className="inline-flex size-7 items-center justify-center rounded border border-slate-200"><FileSignature className="size-3.5" /></button>}</div></ErpTableTd></ErpTableTr>)}</tbody>
      </ErpTableContainer>
    </div>

    <Dialog open={uploadOpen} onOpenChange={setUploadOpen}><DialogContent><DialogHeader><DialogTitle>Novo documento padrão</DialogTitle><DialogDescription>Arquivo armazenado no GED institucional.</DialogDescription></DialogHeader><div className="grid gap-3"><label className="grid gap-1 text-xs font-semibold">Título<input value={title} onChange={event => setTitle(event.target.value)} className="h-9 rounded border px-3 text-sm" /></label><label className="grid gap-1 text-xs font-semibold">Categoria<select value={category} onChange={event => setCategory(event.target.value)} className="h-9 rounded border bg-white px-3 text-sm">{["Procedimento", "Orientação", "Formulário", "Protocolo", "Outro"].map(value => <option key={value}>{value}</option>)}</select></label><label className="grid gap-1 text-xs font-semibold">Módulo<select value={moduleCode} onChange={event => setModuleCode(event.target.value)} className="h-9 rounded border bg-white px-3 text-sm">{modules.map(module => <option key={module.code} value={module.code}>{module.name}</option>)}</select></label><label className="grid gap-1 text-xs font-semibold">PDF<input ref={fileRef} type="file" accept="application/pdf,.pdf" className="rounded border p-2 text-xs" /></label>{message && <p role="status" className="text-xs font-semibold text-rose-700">{message}</p>}</div><DialogFooter><Button variant="outline" onClick={() => setUploadOpen(false)}>Cancelar</Button><Button onClick={upload} disabled={pending || title.trim().length < 3}><Upload className="size-4" />{pending ? "Salvando..." : "Salvar"}</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={Boolean(detail)} onOpenChange={open => !open && setDetail(null)}><DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-[900px]"><DialogHeader><DialogTitle>{detail?.title}</DialogTitle><DialogDescription>{detail?.category} · {detail?.moduleCode} · {detail?.status}</DialogDescription></DialogHeader>{detail && <div className="space-y-3"><iframe title={detail.title} src={`/api/download?url=${encodeURIComponent(detail.fileUrl)}`} className="h-[52vh] w-full rounded border border-slate-200" /><div className="grid gap-3 sm:grid-cols-2"><section><h3 className="mb-1 text-xs font-bold uppercase text-slate-600">Versões</h3>{detail.versions.map(version => <div key={version.id} className="rounded border border-slate-200 p-2 text-xs">Versão {version.versionNumber} · {version.status} · {new Date(version.finalizedAt).toLocaleString("pt-BR")}</div>)}</section><section><h3 className="mb-1 text-xs font-bold uppercase text-slate-600">Histórico de assinaturas</h3>{detail.signatures.map(signature => <div key={signature.id} className="rounded border border-slate-200 p-2 text-xs"><strong>{signature.signerName}</strong><br />{signature.status === "SIGNED" ? `Assinado em ${new Date(signature.signedAt!).toLocaleString("pt-BR")}` : "Pendente"}<br />{signaturePosition(signature.metadata)}</div>)}{!detail.signatures.length && <p className="text-xs text-slate-500">Sem assinaturas registradas.</p>}</section></div></div>}<DialogFooter><Button variant="outline" onClick={() => setDetail(null)}>Fechar</Button>{detail && <a href={`/api/download?url=${encodeURIComponent(detail.fileUrl)}`} target="_blank" rel="noreferrer"><Button>Abrir PDF</Button></a>}</DialogFooter></DialogContent></Dialog>

    <Dialog open={Boolean(signatureDocument)} onOpenChange={open => !open && setSignatureDocument(null)}><DialogContent><DialogHeader><DialogTitle>Assinar documento</DialogTitle><DialogDescription>{signatureDocument?.title}</DialogDescription></DialogHeader><div className="grid gap-3"><label className="grid gap-1 text-xs font-semibold">Página<input type="number" min={1} max={999} value={page} onChange={event => setPage(Number(event.target.value))} className="h-9 rounded border px-3 text-sm" /></label><label className="grid gap-1 text-xs font-semibold">Posição<select value={position} onChange={event => setPosition(event.target.value)} className="h-9 rounded border bg-white px-3 text-sm"><option value="INFERIOR_DIREITA">Inferior direita</option><option value="INFERIOR_ESQUERDA">Inferior esquerda</option><option value="SUPERIOR_DIREITA">Superior direita</option><option value="SUPERIOR_ESQUERDA">Superior esquerda</option></select></label><label className="grid gap-1 text-xs font-semibold">Senha da conta<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" className="h-9 rounded border px-3 text-sm" /></label><p className="rounded bg-slate-50 p-2 text-xs text-slate-600">A assinatura eletrônica interna registra identidade, data, hash e posição. Certificação ICP-Brasil depende de provedor e certificado autorizados.</p>{message && <p role="status" className="text-xs font-semibold text-rose-700">{message}</p>}</div><DialogFooter><Button variant="outline" onClick={() => setSignatureDocument(null)}>Cancelar</Button><Button onClick={sign} disabled={pending || !password}>{pending ? "Assinando..." : "Confirmar assinatura"}</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
