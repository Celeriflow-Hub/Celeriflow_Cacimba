"use client";

import { useState } from "react";
import { UserCog, Plus, Search, Shield, Trash2, X } from "lucide-react";
import { deleteUsuario, upsertUsuario, toggleUsuarioStatus } from "../actions";
import { Card, CardContent } from "@/components/ui/card";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { isStrongFirebasePassword } from "@/lib/firebase/user-provisioning";

const PAGE_SIZE = 20;

type Perfil = { id: string; nome: string; codigo: string };
type Modulo = { id: string; nome: string; codigo: string };
type UsuarioModulo = { moduloId: string; canView: boolean; canEdit: boolean };
type Usuario = {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  perfilId: string;
  perfil: { nome: string };
  employeeId: string | null;
  employee?: { department: { name: string } | null } | null;
  permissoesModulo: UsuarioModulo[];
};
type Servidor = {
  id: string;
  name: string;
  department: { name: string } | null;
};

export default function UsuariosClient({
  usuarios,
  perfis,
  modulos,
  servidores
}: {
  usuarios: Usuario[];
  perfis: Perfil[];
  modulos: Modulo[];
  servidores: Servidor[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{
    id?: string;
    nome: string;
    email: string;
    password: string;
    passwordConfirmation: string;
    perfilId: string;
    employeeId: string;
    ativo: boolean;
    permissoes: Record<string, { canView: boolean; canEdit: boolean }>;
  }>({
    nome: "",
    email: "",
    password: "",
    passwordConfirmation: "",
    perfilId: perfis[0]?.id || "",
    employeeId: "",
    ativo: true,
    permissoes: {}
  });

  const filteredUsuarios = usuarios.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const activePage = Math.min(page, Math.max(1, Math.ceil(filteredUsuarios.length / PAGE_SIZE)));
  const pageUsuarios = filteredUsuarios.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  const selectedPerfil = perfis.find(p => p.id === formData.perfilId);
  const isAdmin = selectedPerfil?.codigo === "SYSTEM_ADMINISTRATOR";

  function openNewModal() {
    setFormData({
      nome: "",
      email: "",
      password: "",
      passwordConfirmation: "",
      perfilId: perfis[0]?.id || "",
      employeeId: "",
      ativo: true,
      permissoes: {}
    });
    setIsModalOpen(true);
  }

  function openEditModal(usuario: Usuario) {
    const permMap: Record<string, { canView: boolean; canEdit: boolean }> = {};
    usuario.permissoesModulo.forEach(p => {
      permMap[p.moduloId] = { canView: p.canView, canEdit: p.canEdit };
    });

    setFormData({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      password: "",
      passwordConfirmation: "",
      perfilId: usuario.perfilId,
      employeeId: usuario.employeeId || "",
      ativo: usuario.ativo,
      permissoes: permMap
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.id && !isStrongFirebasePassword(formData.password)) {
      alert("Informe uma senha com ao menos 8 caracteres, letra maiúscula, número e caractere especial.");
      return;
    }
    if (!formData.id && formData.password !== formData.passwordConfirmation) {
      alert("A senha e a confirmação não coincidem.");
      return;
    }
    setIsSubmitting(true);

    const permissoesArray = Object.entries(formData.permissoes).map(([moduloId, perms]) => ({
      moduloId,
      canView: perms.canView,
      canEdit: perms.canEdit
    }));

    const result = await upsertUsuario({
      id: formData.id,
      nome: formData.nome,
      email: formData.email,
      password: formData.id ? undefined : formData.password,
      perfilId: formData.perfilId,
      employeeId: formData.employeeId || undefined,
      ativo: formData.ativo,
      permissoes: permissoesArray
    });

    if (result.error) {
      alert(result.error);
    } else {
      setIsModalOpen(false);
    }
    setIsSubmitting(false);
  }

  async function handleToggleStatus(id: string, ativo: boolean) {
    const result = await toggleUsuarioStatus(id, ativo);
    if (result.error) alert(result.error);
  }

  async function handleDelete(usuario: Usuario) {
    if (!window.confirm(`Excluir o usuário "${usuario.nome}"? Esta ação não pode ser desfeita.`)) return;

    setDeletingId(usuario.id);
    const result = await deleteUsuario(usuario.id);
    if (result.error) alert(result.error);
    setDeletingId(null);
  }

  return (
    <PageFrame className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Gestão de Usuários"
        icon={<UserCog className="size-4 shrink-0 text-slate-700 dark:text-slate-300" />}
        action={<button onClick={openNewModal} className="flex h-8 items-center gap-2 rounded-md bg-slate-900 px-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900"><Plus className="h-4 w-4" />Novo Usuário</button>}
        className="dark:border-slate-700 dark:bg-slate-800 dark:[&>h1]:text-white"
      />
      <ErpListFrame toolbar={
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou e-mail..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
        } pagination={<ErpPagination page={activePage} total={filteredUsuarios.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="usuários" onPageChange={setPage} />}>
          <table className="w-full table-fixed text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] uppercase text-slate-500 dark:bg-slate-800/95">
              <tr>
                <th className="w-[25%] px-2.5 py-2">Nome</th>
                <th className="w-[26%] px-2.5 py-2">E-mail</th>
                <th className="w-[18%] px-2.5 py-2">Perfil</th>
                <th className="hidden w-[18%] px-2.5 py-2 md:table-cell">Unidade/Setor</th>
                <th className="w-[9%] px-2.5 py-2">Status</th>
                <th className="w-[9%] px-2.5 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pageUsuarios.map((u) => (
                <tr key={u.id} className="h-[38px] border-b border-slate-100 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50">
                  <td className="max-w-0 truncate px-2.5 py-1.5 font-bold text-slate-900 dark:text-white" title={u.nome}>{u.nome}</td>
                  <td className="max-w-0 truncate px-2.5 py-1.5 text-slate-500 dark:text-slate-400" title={u.email}>{u.email}</td>
                  <td className="px-2.5 py-1.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      <Shield className="h-3 w-3" />
                      {u.perfil.nome}
                    </span>
                  </td>
                  <td className="hidden max-w-0 truncate px-2.5 py-1.5 text-slate-600 md:table-cell" title={u.employee?.department?.name || undefined}>{u.employee?.department?.name || "-"}</td>
                  <td className="px-2.5 py-1.5">
                    <button
                      onClick={() => handleToggleStatus(u.id, !u.ativo)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        u.ativo ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {u.ativo ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="px-2.5 py-1.5 text-right">
                    <div className="inline-flex items-center gap-3">
                      <button title="Editar usuário"
                        onClick={() => openEditModal(u)}
                        className="text-gray-600 hover:text-gray-900 font-medium text-sm dark:text-gray-300 dark:hover:text-white"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={deletingId === u.id}
                        className="inline-flex items-center gap-1 text-rose-700 hover:text-rose-900 disabled:cursor-not-allowed disabled:opacity-70 font-medium text-sm dark:text-rose-300 dark:hover:text-rose-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">{deletingId === u.id ? "Excluindo" : "Excluir"}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsuarios.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
      </ErpListFrame>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {formData.id ? "Editar Usuário" : "Novo Usuário"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.nome}
                    onChange={e => setFormData({...formData, nome: e.target.value})}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Institucional</label>
                  <input 
                    required 
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 outline-none"
                  />
                </div>
                {!formData.id && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Senha de Acesso</label>
                      <input
                        required
                        type="password"
                        minLength={8}
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 outline-none"
                      />
                      <p className="mt-1 text-xs text-gray-500">Mínimo de 8 caracteres, com maiúscula, número e caractere especial.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
                      <input
                        required
                        type="password"
                        minLength={8}
                        autoComplete="new-password"
                        value={formData.passwordConfirmation}
                        onChange={e => setFormData({...formData, passwordConfirmation: e.target.value})}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 outline-none"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Acesso</label>
                  <select
                    value={formData.perfilId}
                    onChange={e => setFormData({...formData, perfilId: e.target.value, permissoes: {}})}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 outline-none"
                  >
                    {perfis.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Servidor vinculado</label>
                  <select
                    value={formData.employeeId}
                    onChange={e => setFormData({...formData, employeeId: e.target.value})}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 outline-none"
                  >
                    <option value="">Sem vinculo operacional</option>
                    {servidores.map(servidor => (
                      <option key={servidor.id} value={servidor.id}>
                        {servidor.name}{servidor.department ? ` - ${servidor.department.name}` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Obrigatorio para operar Protocolos e Processos.</p>
                </div>
                <div className="flex items-center mt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.ativo}
                      onChange={e => setFormData({...formData, ativo: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span className="text-sm font-medium text-gray-700">Usuário Ativo</span>
                  </label>
                </div>
              </div>

              {!isAdmin && (
                <div>
                  <h3 className="mb-3 border-b border-slate-200 pb-2 text-base font-semibold text-slate-900 dark:border-slate-700 dark:text-white">Permissões por Módulo</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modulos.map(modulo => {
                      const perm = formData.permissoes[modulo.id] || { canView: false, canEdit: false };
                      return (
                        <Card key={modulo.id} className="shadow-sm">
                          <CardContent className="p-4">
                            <h4 className="font-bold text-sm text-gray-900 mb-3 truncate" title={modulo.nome}>
                              {modulo.nome}
                            </h4>
                            <div className="space-y-2">
                              <label className="flex items-center justify-between text-sm text-gray-600 cursor-pointer">
                                <span>Pode Ver</span>
                                <input 
                                  type="checkbox"
                                  checked={perm.canView || perm.canEdit}
                                  onChange={e => {
                                    const checked = e.target.checked;
                                    setFormData(prev => ({
                                      ...prev,
                                      permissoes: {
                                        ...prev.permissoes,
                                        [modulo.id]: { 
                                          canView: checked, 
                                          canEdit: checked ? perm.canEdit : false 
                                        }
                                      }
                                    }));
                                  }}
                                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                />
                              </label>
                              <label className="flex items-center justify-between text-sm text-gray-600 cursor-pointer">
                                <span>Pode Editar</span>
                                <input 
                                  type="checkbox"
                                  checked={perm.canEdit}
                                  onChange={e => {
                                    const checked = e.target.checked;
                                    setFormData(prev => ({
                                      ...prev,
                                      permissoes: {
                                        ...prev.permissoes,
                                        [modulo.id]: { 
                                          canView: checked ? true : perm.canView, 
                                          canEdit: checked 
                                        }
                                      }
                                    }));
                                  }}
                                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                />
                              </label>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {isAdmin && (
                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start gap-3">
                  <Shield className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Acesso Total</h4>
                    <p className="text-sm mt-1">Este perfil de Administrador possui acesso irrestrito de visualização e edição em todos os módulos do sistema. Não é necessário configurar permissões individuais.</p>
                  </div>
                </div>
              )}
            </form>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-70 flex items-center gap-2"
              >
                {isSubmitting && <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                Salvar Usuário
              </button>
            </div>
          </div>
        </div>
      )}
    </PageFrame>
  );
}
