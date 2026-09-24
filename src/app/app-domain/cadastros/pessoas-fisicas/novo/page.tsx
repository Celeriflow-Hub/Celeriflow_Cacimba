import { ArrowLeft, Save, UserRound } from "lucide-react";
import Link from "next/link";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { createPerson } from "../../actions";

export default function NovaPessoaFisicaPage() {
  return (
    <PageFrame className="max-w-3xl space-y-2">
      <PageHeader title="Nova Pessoa Física" icon={<UserRound className="size-4 shrink-0 text-indigo-600" />} action={<Link href="/cadastros/pessoas-fisicas" className="inline-flex h-7 items-center gap-1.5 rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="size-3.5" />Voltar</Link>} />
      <form action={createPerson} className="space-y-2">
        <div className="grid grid-cols-1 gap-2 rounded border border-slate-300 bg-white p-3 shadow-sm md:grid-cols-2">
          <label className="field md:col-span-2">Nome completo *<input name="fullName" required className="input" /></label>
          <label className="field">CPF *<MaskedInput maskType="cpf" name="cpf" required placeholder="000.000.000-00" className="input" /></label>
          <label className="field">Data de nascimento<input name="birthDate" type="date" className="input" /></label>
          <label className="field">Sexo *<select name="gender" required className="input"><option value="">Selecione</option><option>Feminino</option><option>Masculino</option><option>Outro</option><option>Não informado</option></select></label>
          <label className="field">Raça/cor *<select name="raceColor" required className="input"><option value="">Selecione</option><option>Branca</option><option>Preta</option><option>Parda</option><option>Amarela</option><option>Indígena</option><option>Não informada</option></select></label>
          <label className="field md:col-span-2">Nome da mãe *<input name="motherName" required className="input" /></label>
          <label className="field">E-mail<input name="email" type="email" className="input" /></label>
          <label className="field">Telefone<MaskedInput maskType="phone" name="phonePrimary" className="input" /></label>
          <label className="field">CEP residencial *<MaskedInput maskType="cep" name="zipCode" required className="input" /></label>
          <label className="field">Logradouro residencial *<input name="streetName" required className="input" /></label>
          <label className="field">Número *<input name="number" required className="input" /></label>
          <label className="field">Complemento<input name="complement" className="input" /></label>
        </div>
        <div className="flex h-10 justify-end gap-2 rounded border border-slate-200 bg-slate-50 px-3"><Link href="/cadastros/pessoas-fisicas" className="inline-flex h-7 items-center self-center rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancelar</Link><button className="inline-flex h-7 items-center gap-1.5 self-center rounded bg-indigo-700 px-3 text-xs font-semibold text-white shadow-sm hover:bg-indigo-800"><Save className="size-3.5" />Salvar pessoa</button></div>
      </form>
    </PageFrame>
  );
}
