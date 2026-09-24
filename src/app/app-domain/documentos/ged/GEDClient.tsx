"use client";

import { useState, useRef } from "react";
import {
  Upload, Plus, Folder as FolderIcon, File, X, Check,
  Trash2, MoreVertical, ExternalLink, Search
} from "lucide-react";
import { createFolder, createDocument, deleteDocument, deleteFolder, requestInternalSignatures } from "./actions";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";

const PAGE_SIZE = 20;

type DocItem = {
  id: string;
  title: string;
  documentType: string;
  fileUrl: string;
  status: string;
  createdAt: Date | string;
};
type FolderItem = {
  id: string;
  name: string;
  description: string | null;
  _count: { documents: number; children: number };
};
type DocumentClassItem = { code: string; label: string; signaturePolicy: string };
type SignerItem = { id: string; nome: string; email: string };

export default function GEDClient({
  folders,
  documents,
  currentFolderId,
  documentClasses,
  signers,
}: {
  folders: FolderItem[];
  documents: DocItem[];
  currentFolderId: string | null;
  documentClasses: DocumentClassItem[];
  signers: SignerItem[];
}) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState("Arquivo");
  const [uploadClassCode, setUploadClassCode] = useState("");
  const [uploadPublicLabel, setUploadPublicLabel] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signatureDocument, setSignatureDocument] = useState<DocItem | null>(null);
  const [selectedSignerIds, setSelectedSignerIds] = useState<string[]>([]);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [qrValidationUrl, setQrValidationUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredDocuments = documents.filter((doc) => [doc.title, doc.documentType, doc.status].some((value) => value.toLowerCase().includes(normalizedSearch)));
  const activePage = Math.min(page, Math.max(1, Math.ceil(filteredDocuments.length / PAGE_SIZE)));
  const pageDocuments = filteredDocuments.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    setLoading(true);
    try {
      await createFolder(folderName, currentFolderId);
      setFolderName("");
      setShowFolderModal(false);
    } catch {
      alert("Erro ao criar pasta");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Falha no upload do arquivo");
      }

      const blobData = await response.json();

      await createDocument(uploadTitle, uploadType, uploadClassCode, uploadPublicLabel, blobData.url, currentFolderId);
      
      setUploadTitle("");
      setUploadFile(null);
      setUploadType("Arquivo");
      setUploadClassCode("");
      setUploadPublicLabel("");
      setShowUploadModal(false);
    } catch {
      alert("Erro ao fazer upload");
    } finally {
      setLoading(false);
    }
  };

  const toggleSigner = (signerId: string) => {
    setSelectedSignerIds((current) => current.includes(signerId)
      ? current.filter((id) => id !== signerId)
      : [...current, signerId]);
  };

  const handleRequestSignatures = async () => {
    if (!signatureDocument) return;
    setLoading(true);
    setSignatureError(null);
    const result = await requestInternalSignatures(signatureDocument.id, selectedSignerIds);
    setLoading(false);
    if (result.error) {
      setSignatureError(result.error);
      return;
    }
    setQrValidationUrl(result.qrValidationUrl ?? null);
  };

  const handleDeleteDoc = async (id: string, title: string) => {
    if (!confirm(`Excluir o arquivo "${title}"?`)) return;
    setActiveMenu(null);
    try {
      await deleteDocument(id);
    } catch {
      alert("Erro ao excluir");
    }
  };

  const handleDeleteFolder = async (id: string, name: string) => {
    if (!confirm(`Excluir a pasta "${name}" e todos os seus arquivos?`)) return;
    setActiveMenu(null);
    try {
      await deleteFolder(id);
    } catch {
      alert("Erro ao excluir pasta");
    }
  };

  return (
    <>
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <label className="relative min-w-56 flex-1"><Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" /><span className="sr-only">Buscar documentos</span><input type="search" value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }} placeholder="Buscar documento, categoria ou situação" className="h-8 w-full rounded border border-slate-300 bg-white pl-8 pr-2 text-xs outline-none focus:border-indigo-600" /></label>
        <button
          onClick={() => setShowFolderModal(true)}
          className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Pasta
        </button>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload
        </button>
      </div>

      {/* Folder Grid */}
      {folders.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Pastas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {folders.map((folder) => (
              <div key={folder.id} className="relative group">
                <a
                  href={`/documentos/ged?folderId=${folder.id}`}
                  className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <FolderIcon className="w-8 h-8 text-amber-400 shrink-0" fill="currentColor" fillOpacity={0.25} />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{folder.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{folder._count.documents} arq. · {folder._count.children} pastas</p>
                  </div>
                </a>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === folder.id ? null : folder.id); }}
                  className="absolute top-2 right-2 p-1 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded opacity-0 group-hover:opacity-100 transition-all"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {activeMenu === folder.id && (
                  <div className="absolute top-8 right-2 z-20 bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[140px]">
                    <button
                      onClick={() => handleDeleteFolder(folder.id, folder.name)}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir pasta
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files Table */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
          {currentFolderId ? "Arquivos na Pasta" : "Arquivos Recentes"}
        </h3>
        {documents.length === 0 ? (
          <div className="p-10 text-center bg-slate-50 rounded-xl border border-slate-200 border-dashed">
            <File className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm font-medium">Nenhum arquivo encontrado</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-3 text-xs text-indigo-600 hover:underline font-semibold"
            >
              Fazer upload do primeiro arquivo
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <div className="max-h-[32rem] overflow-y-auto">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Tipo</th>
                  <th className="px-4 py-3 hidden md:table-cell">Status</th>
                  <th className="px-4 py-3 hidden md:table-cell">Adicionado em</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="font-medium text-slate-800 truncate max-w-[200px]">{doc.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{doc.documentType}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        doc.status === 'Válido' ? 'bg-emerald-100 text-emerald-700' :
                        doc.status === 'Pendente Assinatura' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">
                      {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === doc.id ? null : doc.id)}
                        className="p-1 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {activeMenu === doc.id && (
                        <div className="absolute top-8 right-2 z-20 bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[160px]">
                          <a
                            href={doc.fileUrl.startsWith("http") ? `/api/download?url=${encodeURIComponent(doc.fileUrl)}` : doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                            onClick={() => setActiveMenu(null)}
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Visualizar
                          </a>
                          <button
                            onClick={() => { setActiveMenu(null); setSignatureDocument(doc); setSelectedSignerIds([]); setSignatureError(null); setQrValidationUrl(null); }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                          >
                            <Check className="w-3.5 h-3.5" /> Solicitar assinaturas
                          </button>
                          <button
                            onClick={() => handleDeleteDoc(doc.id, doc.title)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Excluir
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="border-t border-slate-200 px-3 py-1.5"><ErpPagination page={activePage} total={filteredDocuments.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="documentos" onPageChange={setPage} /></div>
          </div>
        )}
      </div>

      {/* Backdrop for closing menus */}
      {activeMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
      )}

      {/* Nova Pasta Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowFolderModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FolderIcon className="w-5 h-5 text-indigo-600" /> Nova Pasta
              </h2>
              <button onClick={() => setShowFolderModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nome da Pasta</label>
            <input
              type="text"
              placeholder="Ex: Contratos 2026"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowFolderModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
              <button
                onClick={handleCreateFolder}
                disabled={!folderName.trim() || loading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? "Criando..." : <><Check className="w-4 h-4" /> Criar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowUploadModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" /> Upload de Arquivo
              </h2>
              <button onClick={() => setShowUploadModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* File Picker */}
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-6 text-center cursor-pointer transition-colors mb-4"
            >
              <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              {uploadFile ? (
                <p className="text-sm font-semibold text-indigo-600">{uploadFile.name}</p>
              ) : (
                <p className="text-sm text-slate-500">Clique para selecionar um arquivo</p>
              )}
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setUploadFile(f);
                    if (!uploadTitle) setUploadTitle(f.name.replace(/\.[^.]+$/, ""));
                  }
                }}
              />
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Título do Documento</label>
                <input
                  type="text"
                  placeholder="Nome do documento"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Documento</label>
               <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                >
                  <option>Arquivo</option>
                  <option>Ofício</option>
                  <option>Contrato</option>
                  <option>Portaria</option>
                  <option>Decreto</option>
                  <option>Edital</option>
                  <option>Relatório</option>
                  <option>Norma</option>
                  <option>Projeto</option>
               </select>
               </div>
               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-1">Classe documental</label>
                 <select
                   value={uploadClassCode}
                   onChange={(e) => setUploadClassCode(e.target.value)}
                   className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                 >
                   <option value="">Selecione a classe...</option>
                   {documentClasses.map((documentClass) => (
                     <option key={documentClass.code} value={documentClass.code}>{documentClass.label}</option>
                   ))}
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-1">Rótulo público de validação</label>
                 <input
                   value={uploadPublicLabel}
                   onChange={(e) => setUploadPublicLabel(e.target.value)}
                   placeholder="Ex: Documento administrativo autenticado"
                   className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                 />
               </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
              <button
                onClick={handleUpload}
                disabled={!uploadFile || !uploadTitle.trim() || !uploadClassCode || loading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? "Enviando..." : <><Check className="w-4 h-4" /> Confirmar Upload</>}
              </button>
            </div>
          </div>
        </div>
      )}
      {signatureDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onClick={() => !loading && setSignatureDocument(null)}>
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900">Solicitar assinaturas internas</h2>
            <p className="mt-1 text-sm text-slate-600">{signatureDocument.title}</p>
            {qrValidationUrl ? (
              <div className="mt-4 space-y-3">
                <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Solicitação criada para todos os signatários selecionados.</p>
                <label className="block text-sm font-semibold text-slate-700">URL de validação/QR
                  <input readOnly value={qrValidationUrl} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
                </label>
              </div>
            ) : (
              <div className="mt-4 max-h-56 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3 pr-2">
                {signers.map((signer) => (
                  <label key={signer.id} className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={selectedSignerIds.includes(signer.id)} onChange={() => toggleSigner(signer.id)} />
                    <span>{signer.nome}<span className="block text-xs text-slate-400">{signer.email}</span></span>
                  </label>
                ))}
              </div>
            )}
            {signatureError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{signatureError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setSignatureDocument(null)} disabled={loading} className="px-4 py-2 text-sm font-semibold text-slate-600">{qrValidationUrl ? "Fechar" : "Cancelar"}</button>
              {!qrValidationUrl && <button onClick={handleRequestSignatures} disabled={selectedSignerIds.length === 0 || loading} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50">{loading ? "Solicitando..." : "Solicitar"}</button>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
