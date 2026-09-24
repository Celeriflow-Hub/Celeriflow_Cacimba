"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { createEmployee } from "../actions";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

type NamedOption = { id: string; name: string };

type NovoServidorFormProps = {
  roles: NamedOption[];
  secretariats: NamedOption[];
  departments: NamedOption[];
  units: NamedOption[];
};

export default function NovoServidorForm({ roles, secretariats, departments, units }: NovoServidorFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await createEmployee(new FormData(e.currentTarget));
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <PageFrame className="max-w-4xl space-y-2">
      <PageHeader title="Novo Servidor" action={<Link href="/administracao/servidores" className="inline-flex h-7 items-center gap-1.5 rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="size-3.5" />Voltar</Link>} />

      <form onSubmit={handleSubmit} className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="space-y-4 p-3">
          {error && <div className="rounded border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-700">{error}</div>}
          
          <div>
            <h2 className="mb-2 border-b border-slate-200 pb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">Dados Pessoais</h2>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Nome Completo *</label>
                <input type="text" name="name" required className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">CPF *</label>
                <input type="text" name="cpf" required className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">E-mail</label>
                <input type="email" name="email" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Telefone</label>
                <input type="text" name="phone" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm" />
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-2 border-b border-slate-200 pb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">Vínculo e Alocação</h2>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Matrícula</label>
                <input type="text" name="registration" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Cargo / Função</label>
                <select name="roleId" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm bg-white">
                  <option value="">Selecione...</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Secretaria</label>
                <select name="secretariatId" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm bg-white">
                  <option value="">Nenhuma / Sem Vínculo</option>
                  {secretariats.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Departamento</label>
                <select name="departmentId" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm bg-white">
                  <option value="">Nenhum / Sem Vínculo</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Unidade Administrativa (Escolas/UBS)</label>
                <select name="unitId" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm bg-white">
                  <option value="">Nenhuma / Sem Vínculo</option>
                  {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="flex h-10 justify-end border-t border-slate-200 bg-slate-50 px-3">
          <button type="submit" disabled={loading} className="inline-flex h-7 items-center gap-1.5 self-center rounded bg-emerald-700 px-3 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50">
            <Save className="size-3.5" /> {loading ? "Salvando..." : "Salvar Servidor"}
          </button>
        </div>
      </form>
    </PageFrame>
  );
}
