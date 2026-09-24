import { Building2, Save, ArrowLeft, Building, Briefcase, Phone, Mail } from "lucide-react";
import Link from "next/link";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { createCompany } from "../../actions";

export default function NovaPessoaJuridicaPage() {
  return (
    <PageFrame className="max-w-4xl space-y-2">
      <PageHeader title="Nova Pessoa Jurídica" icon={<Building2 className="size-4 shrink-0 text-emerald-600" />} action={<Link href="/cadastros/pessoas-juridicas" className="inline-flex h-7 items-center gap-1.5 rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="size-3.5" />Voltar</Link>} />

      <form action={createCompany} className="space-y-2">
        <div className="rounded border border-slate-300 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center gap-2 border-b border-slate-200 pb-1.5 text-xs font-bold uppercase tracking-[0.08em] text-emerald-700">
            <Building className="size-4" />
            Dados Básicos
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="corporateName" className="block text-sm font-medium text-slate-700 mb-1">Razão Social *</label>
              <input type="text" id="corporateName" name="corporateName" required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600" />
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="tradeName" className="block text-sm font-medium text-slate-700 mb-1">Nome Fantasia *</label>
              <input required type="text" id="tradeName" name="tradeName" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600" />
            </div>

            <div>
              <label htmlFor="cnpj" className="block text-sm font-medium text-slate-700 mb-1">CNPJ *</label>
              <MaskedInput maskType="cnpj" type="text" id="cnpj" name="cnpj" required placeholder="00.000.000/0000-00" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600" />
            </div>

            <div>
              <label htmlFor="municipalInsc" className="block text-sm font-medium text-slate-700 mb-1">Inscrição Municipal</label>
              <input type="text" id="municipalInsc" name="municipalInsc" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600" />
            </div>
            
            <div>
              <label htmlFor="companyType" className="block text-sm font-medium text-slate-700 mb-1">Tipo de Empresa</label>
              <select id="companyType" name="companyType" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600">
                <option value="">Selecione...</option>
                <option value="MEI">MEI (Microempreendedor Individual)</option>
                <option value="ME">ME (Microempresa)</option>
                <option value="EPP">EPP (Empresa de Pequeno Porte)</option>
                <option value="LTDA">LTDA (Sociedade Limitada)</option>
                <option value="SA">SA (Sociedade Anônima)</option>
                <option value="ASSOCIACAO">Associação / ONG</option>
                <option value="OUTROS">Outros</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded border border-slate-300 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center gap-2 border-b border-slate-200 pb-1.5 text-xs font-bold uppercase tracking-[0.08em] text-emerald-700">
            <Briefcase className="size-4" />
            Contatos
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="emailPrimary" className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> E-mail Principal</label>
              <input type="email" id="emailPrimary" name="emailPrimary" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600" />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> Telefone / WhatsApp</label>
              <MaskedInput maskType="phone" type="text" id="phone" name="phone" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600" />
            </div>
          </div>
        </div>

        <div className="flex h-10 justify-end gap-2 rounded border border-slate-200 bg-slate-50 px-3">
          <Link href="/cadastros/pessoas-juridicas" className="inline-flex h-7 items-center self-center rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            Cancelar
          </Link>
          <button type="submit" className="inline-flex h-7 items-center gap-1.5 self-center rounded bg-emerald-700 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800">
            <Save className="size-3.5" />
            Salvar Empresa
          </button>
        </div>
      </form>
    </PageFrame>
  );
}
