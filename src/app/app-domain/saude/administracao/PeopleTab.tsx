"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, Plus } from "lucide-react";
import type { CompanyRow, PersonRow } from "./AdministracaoClient";

type Props = { kind: "person" | "company"; people: PersonRow[]; companies: CompanyRow[]; canManage: boolean };

export default function PeopleTab({ kind, people, companies, canManage }: Props) {
  const [person, setPerson] = useState<PersonRow | null>(null);
  const [company, setCompany] = useState<CompanyRow | null>(null);
  const createHref = kind === "person" ? "/cadastros/pessoas-fisicas/novo" : "/cadastros/pessoas-juridicas/novo";

  return <>
    {canManage && <div className="flex justify-end border-b border-slate-200 p-2 dark:border-slate-700"><Link href={createHref} className="inline-flex h-8 items-center gap-1.5 rounded bg-emerald-700 px-3 text-xs font-semibold text-white"><Plus className="size-3.5" />Cadastrar no cadastro único</Link></div>}
    <table className="w-full table-fixed border-collapse text-left text-xs">
      <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-[10px] uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        {kind === "person" ? <tr><th className="w-[30%] px-3 py-2">Pessoa</th><th className="w-[18%] px-3 py-2">CPF</th><th className="w-[20%] px-3 py-2">Contato</th><th className="w-[18%] px-3 py-2">Vínculos</th><th className="w-[10%] px-3 py-2">Situação</th><th className="w-16 px-3 py-2">Ação</th></tr> : <tr><th className="w-[32%] px-3 py-2">Razão social</th><th className="w-[22%] px-3 py-2">Nome fantasia</th><th className="w-[20%] px-3 py-2">CNPJ</th><th className="w-[12%] px-3 py-2">Código</th><th className="w-[10%] px-3 py-2">Situação</th><th className="w-16 px-3 py-2">Ação</th></tr>}
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {kind === "person" ? people.map(row => <tr key={row.id} className="h-9 hover:bg-slate-50 dark:hover:bg-slate-800/60"><td className="truncate px-3 font-medium">{row.fullName}</td><td className="truncate px-3">{row.cpf}</td><td className="truncate px-3">{row.phonePrimary || row.email || "-"}</td><td className="truncate px-3">{[row.isPatient && "Paciente", row.usuario && "Usuário"].filter(Boolean).join(" · ") || "Pessoa"}</td><td className="px-3">{row.status}</td><td className="px-3"><button title="Visualizar" onClick={() => setPerson(row)} className="rounded p-1 text-slate-500 hover:text-emerald-700"><Eye className="size-3.5" /></button></td></tr>) : companies.map(row => <tr key={row.id} className="h-9 hover:bg-slate-50 dark:hover:bg-slate-800/60"><td className="truncate px-3 font-medium">{row.corporateName}</td><td className="truncate px-3">{row.tradeName || "-"}</td><td className="truncate px-3">{row.cnpj}</td><td className="truncate px-3 font-mono text-[10px]">{row.id}</td><td className="px-3">{row.status}</td><td className="px-3"><button title="Visualizar" onClick={() => setCompany(row)} className="rounded p-1 text-slate-500 hover:text-emerald-700"><Eye className="size-3.5" /></button></td></tr>)}
      </tbody>
    </table>
    {person && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><div className="w-full max-w-lg rounded-md bg-white shadow-xl dark:bg-slate-900"><div className="flex justify-between border-b px-4 py-3 dark:border-slate-700"><h2 className="text-sm font-bold">{person.fullName}</h2><button onClick={() => setPerson(null)} className="text-xs text-slate-500">Fechar</button></div><div className="grid gap-2 p-4 text-xs sm:grid-cols-2"><p><b>CPF:</b> {person.cpf}</p><p><b>Nascimento:</b> {person.birthDate ? new Date(person.birthDate).toLocaleDateString("pt-BR") : "Não informado"}</p><p><b>Sexo:</b> {person.gender || "Não informado"}</p><p><b>Raça/cor:</b> {person.raceColor || "Não informada"}</p><p className="sm:col-span-2"><b>Nome da mãe:</b> {person.motherName || "Não informado"}</p><p><b>Documentos:</b> {person.documentCount}</p><p><b>Usuário:</b> {person.usuario ? `${person.usuario.nome} (${person.usuario.ativo ? "ativo" : "inativo"})` : "Não vinculado"}</p><div className="sm:col-span-2"><b>Endereços únicos:</b>{person.addresses.length ? person.addresses.map(address => <p key={address.id} className="mt-1 text-slate-600 dark:text-slate-300">{address.addressType || "Endereço"}: {address.streetName || "logradouro não informado"}, {address.number || "s/n"} · CEP {address.zipCode || "não informado"}</p>) : <p className="mt-1 text-rose-700">Nenhum endereço cadastrado.</p>}</div></div></div></div>}
    {company && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><div className="w-full max-w-lg rounded-md bg-white shadow-xl dark:bg-slate-900"><div className="flex justify-between border-b px-4 py-3 dark:border-slate-700"><h2 className="text-sm font-bold">{company.corporateName}</h2><button onClick={() => setCompany(null)} className="text-xs text-slate-500">Fechar</button></div><div className="grid gap-2 p-4 text-xs sm:grid-cols-2"><p><b>Nome fantasia:</b> {company.tradeName || "Não informado"}</p><p><b>CNPJ:</b> {company.cnpj}</p><p><b>Telefone:</b> {company.phone || "Não informado"}</p><p><b>E-mail:</b> {company.emailPrimary || "Não informado"}</p><p className="sm:col-span-2"><b>Código estável:</b> <span className="font-mono">{company.id}</span></p></div></div></div>}
  </>;
}
