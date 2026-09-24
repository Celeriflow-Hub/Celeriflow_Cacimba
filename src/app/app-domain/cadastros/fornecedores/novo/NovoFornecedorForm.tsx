"use client";

import { useState } from "react";
import { List, Save, User } from "lucide-react";
import Link from "next/link";

type PersonOption = {
  id: string;
  fullName: string;
  cpf: string;
};

type CompanyOption = {
  id: string;
  corporateName: string;
  cnpj: string;
  companyType: string | null;
  primaryCnae: string | null;
  secondaryCnaes: string | null;
};

const formControlClass = "min-h-10 w-full rounded border border-slate-300 bg-white px-2.5 text-base text-slate-700 outline-none focus:border-fuchsia-600 focus:ring-2 focus:ring-fuchsia-600/15 disabled:bg-slate-100 disabled:text-slate-400 sm:h-8 sm:min-h-0 sm:text-xs";
const fieldLabelClass = "mb-1 block text-xs font-semibold text-slate-700";

function companyTypeLabel(companyType: string | null) {
  if (companyType === "ME") return "ME (Microempresa)";
  if (companyType === "EPP") return "EPP (Empresa de Pequeno Porte)";
  if (companyType === "MEI") return "MEI";
  return companyType || "Não informado";
}

export default function NovoFornecedorForm({
  persons,
  companies,
  action,
}: {
  persons: PersonOption[];
  companies: CompanyOption[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [supplierType, setSupplierType] = useState<"PF" | "PJ">("PJ");
  const [personId, setPersonId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [primaryCnae, setPrimaryCnae] = useState("");
  const [secondaryCnaes, setSecondaryCnaes] = useState("");
  const selectedCompany = companies.find((company) => company.id === companyId) ?? null;

  function changeSupplierType(value: "PF" | "PJ") {
    setSupplierType(value);
    setPersonId("");
    setCompanyId("");
    setPrimaryCnae("");
    setSecondaryCnaes("");
  }

  function changeCompany(value: string) {
    const company = companies.find((item) => item.id === value) ?? null;
    setCompanyId(value);
    setPrimaryCnae(company?.primaryCnae ?? "");
    setSecondaryCnaes(company?.secondaryCnaes ?? "");
  }

  return (
    <form action={action} className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="min-h-0 flex-1 space-y-2 overflow-auto p-2.5 sm:p-3">
        <section className="rounded border border-slate-200 bg-slate-50/50 p-3">
          <div className="mb-2 flex items-center gap-2 border-b border-slate-200 pb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-fuchsia-700">
            <User className="size-4" />
            Vínculo do Fornecedor
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="supplierType" className={fieldLabelClass}>Tipo de fornecedor *</label>
              <select
                id="supplierType"
                name="supplierType"
                value={supplierType}
                onChange={(event) => changeSupplierType(event.target.value as "PF" | "PJ")}
                className={formControlClass}
              >
                <option value="PJ">Pessoa Jurídica (CNPJ)</option>
                <option value="PF">Pessoa Física (CPF)</option>
              </select>
              <p className="mt-1 text-[11px] text-slate-500">A seleção define a única identidade aceita no envio. CPF e CNPJ não podem ser combinados.</p>
            </div>

            {supplierType === "PJ" ? (
              <div className="sm:col-span-2">
                <label htmlFor="companyId" className={fieldLabelClass}>Pessoa Jurídica (CNPJ) *</label>
                <select
                  id="companyId"
                  name="companyId"
                  value={companyId}
                  onChange={(event) => changeCompany(event.target.value)}
                  required
                  className={formControlClass}
                >
                  <option value="">Selecione a empresa...</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.corporateName} - CNPJ: {company.cnpj}</option>
                  ))}
                </select>
                {selectedCompany && (
                  <p className="mt-1 text-[11px] text-slate-500">Enquadramento empresarial no cadastro único: <span className="font-semibold text-slate-700">{companyTypeLabel(selectedCompany.companyType)}</span>.</p>
                )}
              </div>
            ) : (
              <div className="sm:col-span-2">
                <label htmlFor="personId" className={fieldLabelClass}>Pessoa Física (CPF) *</label>
                <select
                  id="personId"
                  name="personId"
                  value={personId}
                  onChange={(event) => setPersonId(event.target.value)}
                  required
                  className={formControlClass}
                >
                  <option value="">Selecione a pessoa física...</option>
                  {persons.map((person) => (
                    <option key={person.id} value={person.id}>{person.fullName} - CPF: {person.cpf}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>

        <section className="rounded border border-slate-200 bg-slate-50/50 p-3">
          <div className="mb-2 flex items-center gap-2 border-b border-slate-200 pb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-fuchsia-700">
            <List className="size-4" />
            Dados do Fornecedor
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className={fieldLabelClass}>Categoria de fornecimento</label>
              <select id="category" name="category" className={formControlClass}>
                <option value="">Selecione...</option>
                <option value="Materiais">Materiais Diversos</option>
                <option value="Serviços">Prestação de Serviços</option>
                <option value="Obras">Obras e Engenharia</option>
                <option value="Equipamentos">Equipamentos</option>
                <option value="Tecnologia">Tecnologia da Informação</option>
              </select>
            </div>

            <div>
              <label htmlFor="businessBranch" className={fieldLabelClass}>Ramo de atividade</label>
              <input type="text" id="businessBranch" name="businessBranch" className={formControlClass} />
            </div>

            {supplierType === "PJ" && (
              <>
                <div>
                  <label htmlFor="primaryCnae" className={fieldLabelClass}>CNAE principal</label>
                  <input
                    type="text"
                    id="primaryCnae"
                    name="primaryCnae"
                    value={primaryCnae}
                    onChange={(event) => setPrimaryCnae(event.target.value)}
                    disabled={!companyId}
                    placeholder="Código e descrição cadastrados"
                    className={formControlClass}
                  />
                </div>
                <div>
                  <label htmlFor="secondaryCnaes" className={fieldLabelClass}>CNAEs secundários</label>
                  <input
                    type="text"
                    id="secondaryCnaes"
                    name="secondaryCnaes"
                    value={secondaryCnaes}
                    onChange={(event) => setSecondaryCnaes(event.target.value)}
                    disabled={!companyId}
                    placeholder="Separe os vínculos por ponto e vírgula"
                    className={formControlClass}
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="certificationsValidUntil" className={fieldLabelClass}>Validade das certidões (habilitação)</label>
              <input type="date" id="certificationsValidUntil" name="certificationsValidUntil" className={formControlClass} />
            </div>

            <div>
              <label htmlFor="bankData" className={fieldLabelClass}>Dados bancários</label>
              <input type="text" id="bankData" name="bankData" placeholder="Banco, Agência, Conta..." className={formControlClass} />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="notes" className={fieldLabelClass}>Observações</label>
              <textarea id="notes" name="notes" rows={3} className={`${formControlClass} h-auto py-2`} />
            </div>
          </div>
        </section>
      </div>

      <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white px-3 py-2 sm:flex-row sm:justify-end">
        <Link href="/cadastros/fornecedores" className="inline-flex min-h-10 items-center justify-center rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:h-8 sm:min-h-0">Cancelar</Link>
        <button type="submit" className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded bg-fuchsia-700 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-fuchsia-800 sm:h-8 sm:min-h-0">
          <Save className="size-3.5" />
          Salvar Fornecedor
        </button>
      </div>
    </form>
  );
}
