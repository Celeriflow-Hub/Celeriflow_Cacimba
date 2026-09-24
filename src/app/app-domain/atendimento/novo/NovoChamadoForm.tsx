"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, User, UserX } from "lucide-react";
import { SubmitButton } from "./SubmitButton";

type Channel = { id: string; name: string };
type Department = { id: string; name: string };
type Subject = { id: string; name: string; defaultDepartmentId: string | null; defaultPriority: string; defaultDueDays: number | null };

export default function NovoChamadoForm({ channels, departments, subjects, createTicketAction }: { channels: Channel[]; departments: Department[]; subjects: Subject[]; createTicketAction: (formData: FormData) => Promise<void> }) {
  const [requesterType, setRequesterType] = useState<"person" | "company" | "anonymous">("anonymous");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const selectedSubject = subjects.find((subject) => subject.id === selectedSubjectId);

  return (
    <form action={createTicketAction} className="overflow-hidden rounded border border-slate-300 bg-white shadow-sm">
      <div className="space-y-4 p-3">
        <section className="space-y-2">
          <h2 className="border-b border-slate-200 pb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">1. Solicitante</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {[
              ["anonymous", "Anônimo", "Não vincula dados do solicitante.", UserX],
              ["person", "Pessoa Física", "Localiza ou atualiza o cadastro pela CPF.", User],
              ["company", "Pessoa Jurídica", "Localiza ou atualiza o cadastro pelo CNPJ.", Building2],
            ].map(([value, title, description, Icon]) => (
              <label key={value as string} className={`flex cursor-pointer gap-2 rounded border p-2.5 ${requesterType === value ? "border-violet-600 bg-violet-50 ring-1 ring-violet-600" : "border-slate-200"}`}>
                <input type="radio" name="requesterType" value={value as string} checked={requesterType === value} onChange={() => setRequesterType(value as "person" | "company" | "anonymous")} className="mt-1" />
                <span><strong className="flex gap-2 items-center text-slate-800"><Icon className="w-4 h-4" />{title as string}</strong><small className="text-slate-500">{description as string}</small></span>
              </label>
            ))}
          </div>
          {requesterType === "person" && <div className="grid grid-cols-1 gap-2 rounded border border-slate-200 bg-slate-50 p-2.5 md:grid-cols-3"><input name="fullName" required placeholder="Nome completo" className="input" /><input name="cpf" required maxLength={14} placeholder="CPF" className="input" /><input name="phone" placeholder="Telefone" className="input" /></div>}
          {requesterType === "company" && <div className="grid grid-cols-1 gap-2 rounded border border-slate-200 bg-slate-50 p-2.5 md:grid-cols-3"><input name="corporateName" required placeholder="Razão social" className="input" /><input name="cnpj" required maxLength={18} placeholder="CNPJ" className="input" /><input name="companyPhone" placeholder="Telefone" className="input" /></div>}
        </section>

        <section className="space-y-2">
          <h2 className="border-b border-slate-200 pb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">2. Demanda e encaminhamento</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <label className="field">Canal *<select name="channelId" required className="input">{channels.map((channel) => <option key={channel.id} value={channel.id}>{channel.name}</option>)}</select></label>
            <label className="field">Assunto parametrizado<select name="serviceSubjectId" value={selectedSubjectId} onChange={(event) => setSelectedSubjectId(event.target.value)} className="input"><option value="">Não classificado</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
            <label className="field">Setor responsável<select name="departmentId" defaultValue={selectedSubject?.defaultDepartmentId || ""} key={selectedSubject?.defaultDepartmentId || "none"} className="input"><option value="">Triagem posterior</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
            <label className="field">Prioridade<select name="priority" defaultValue={selectedSubject?.defaultPriority || "Normal"} key={selectedSubject?.defaultPriority || "normal"} className="input"><option>Baixa</option><option>Normal</option><option>Alta</option><option>Urgente</option></select></label>
            <label className="field md:col-span-2">Resumo *<input name="subject" required placeholder="Ex.: Iluminação pública em via" className="input" /></label>
            <label className="field md:col-span-2">Descrição *<textarea name="description" required rows={5} placeholder="Registre os fatos, endereço e referências." className="input resize-none" /></label>
          </div>
          {selectedSubject?.defaultDueDays && <p className="text-sm text-violet-700">O prazo previsto será de {selectedSubject.defaultDueDays} dia(s), conforme o assunto selecionado.</p>}
        </section>
      </div>
      <div className="flex h-10 justify-end gap-2 border-t border-slate-200 bg-slate-50 px-3"><Link href="/atendimento/central" className="inline-flex h-7 items-center self-center rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancelar</Link><SubmitButton /></div>
    </form>
  );
}
