"use client";

import { useState } from "react";
import { Gift, Plus, CheckCircle, Package } from "lucide-react";
import { createSocialBenefit, createSocialProgram } from "../actions";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

type SocialBenefit = { id: string; name: string; description: string | null; isRecurrent: boolean };
type SocialProgram = { id: string; name: string; description: string | null; sphere: string };
type Secretariat = { id: string; name: string };
type BudgetAppropriation = { id: string; code: string; expenseNature: { name: string } | null };
type ExpenseData = { description: string; value: number; secretariatId: string; appropriationId: string };

export default function BeneficiosClient({ beneficiosInicial, programasInicial, secretariats, appropriations }: {
  beneficiosInicial: SocialBenefit[];
  programasInicial: SocialProgram[];
  secretariats: Secretariat[];
  appropriations: BudgetAppropriation[];
}) {
  const [beneficios, setBeneficios] = useState<SocialBenefit[]>(beneficiosInicial);
  const [programas, setProgramas] = useState<SocialProgram[]>(programasInicial);
  
  const [isBenefitModalOpen, setIsBenefitModalOpen] = useState(false);
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  
  const [benefitData, setBenefitData] = useState({
    name: "", description: "", isRecurrent: false,
    hasExpense: false, expenseDesc: "", expenseValue: "", secretariatId: "", appropriationId: ""
  });
  
  const [programData, setProgramData] = useState({
    name: "", sphere: "Municipal", description: "",
    hasExpense: false, expenseDesc: "", expenseValue: "", secretariatId: "", appropriationId: ""
  });

  const handleSaveBenefit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: { name: string; description: string; isRecurrent: boolean; expense?: ExpenseData } = {
      name: benefitData.name,
      description: benefitData.description,
      isRecurrent: benefitData.isRecurrent,
    };
    if (benefitData.hasExpense) {
      data.expense = {
        description: benefitData.expenseDesc,
        value: Number(benefitData.expenseValue),
        secretariatId: benefitData.secretariatId,
        appropriationId: benefitData.appropriationId
      };
    }
    const res = await createSocialBenefit(data);
    if (res.success && res.data) {
      setBeneficios([...beneficios, res.data]);
      setIsBenefitModalOpen(false);
      setBenefitData({ name: "", description: "", isRecurrent: false, hasExpense: false, expenseDesc: "", expenseValue: "", secretariatId: "", appropriationId: "" });
    }
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: { name: string; description: string; sphere: string; expense?: ExpenseData } = {
      name: programData.name,
      description: programData.description,
      sphere: programData.sphere,
    };
    if (programData.hasExpense) {
      data.expense = {
        description: programData.expenseDesc,
        value: Number(programData.expenseValue),
        secretariatId: programData.secretariatId,
        appropriationId: programData.appropriationId
      };
    }
    const res = await createSocialProgram(data);
    if (res.success && res.data) {
      setProgramas([...programas, res.data]);
      setIsProgramModalOpen(false);
      setProgramData({ name: "", sphere: "Municipal", description: "", hasExpense: false, expenseDesc: "", expenseValue: "", secretariatId: "", appropriationId: "" });
    }
  };

  return (
    <PageFrame className="space-y-2">
      <PageHeader title="Programas e benefícios" icon={<Gift className="size-4 shrink-0 text-blue-600" />} />
      <p className="px-1 text-sm text-slate-500">Gestão de auxílios eventuais, cestas básicas e programas sociais.</p>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Package className="size-4 text-indigo-600" />
              Benefícios Eventuais
            </h2>
            <button onClick={() => setIsBenefitModalOpen(true)} className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              <Plus className="size-3.5" /> Novo benefício
            </button>
          </div>

            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {beneficios.length > 0 ? (
                beneficios.map((beneficio) => (
                  <li key={beneficio.id} className="flex items-start justify-between gap-3 p-3 hover:bg-slate-50/50">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">{beneficio.name}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{beneficio.description || 'Sem descrição'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${beneficio.isRecurrent ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {beneficio.isRecurrent ? 'Recorrente' : 'Eventual'}
                      </span>
                    </div>
                  </li>
                ))
              ) : (
                <li className="p-6 text-center text-slate-500 text-sm">Nenhum benefício cadastrado.</li>
              )}
            </ul>
        </section>

        <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <CheckCircle className="size-4 text-emerald-600" />
              Programas Governamentais
            </h2>
            <button onClick={() => setIsProgramModalOpen(true)} className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              <Plus className="size-3.5" /> Novo programa
            </button>
          </div>

            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {programas.length > 0 ? (
                programas.map((programa) => (
                  <li key={programa.id} className="flex items-start justify-between gap-3 p-3 hover:bg-slate-50/50">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">{programa.name}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{programa.description || 'Sem descrição'}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                        {programa.sphere}
                      </span>
                    </div>
                  </li>
                ))
              ) : (
                <li className="p-6 text-center text-slate-500 text-sm">Nenhum programa cadastrado.</li>
              )}
            </ul>
        </section>
      </div>

      {isBenefitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Novo Benefício Eventual</h2>
              <button onClick={() => setIsBenefitModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            
            <form onSubmit={handleSaveBenefit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Nome do Benefício</label>
                  <input required type="text" value={benefitData.name} onChange={e => setBenefitData({...benefitData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Descrição</label>
                  <textarea rows={2} value={benefitData.description} onChange={e => setBenefitData({...benefitData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="rec" checked={benefitData.isRecurrent} onChange={e => setBenefitData({...benefitData, isRecurrent: e.target.checked})} className="rounded text-blue-600 focus:ring-blue-600" />
                  <label htmlFor="rec" className="text-sm text-slate-700">Benefício Recorrente (ex: Auxílio Aluguel)</label>
                </div>
                
                <hr className="my-2" />
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="bExpense" checked={benefitData.hasExpense} onChange={e => setBenefitData({...benefitData, hasExpense: e.target.checked})} className="rounded text-blue-600 focus:ring-blue-600" />
                  <label htmlFor="bExpense" className="text-sm font-semibold text-slate-800">Vincular Custo / Despesa (Integração Finanças)</label>
                </div>
                
                {benefitData.hasExpense && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Descrição da Despesa</label>
                      <input required type="text" value={benefitData.expenseDesc} onChange={e => setBenefitData({...benefitData, expenseDesc: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">Valor Estimado (R$)</label>
                      <input required type="number" step="0.01" value={benefitData.expenseValue} onChange={e => setBenefitData({...benefitData, expenseValue: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">Secretaria (Ordenadora)</label>
                      <select required value={benefitData.secretariatId} onChange={e => setBenefitData({...benefitData, secretariatId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                        <option value="">Selecione...</option>
                        {secretariats.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Dotação Orçamentária</label>
                      <select required value={benefitData.appropriationId} onChange={e => setBenefitData({...benefitData, appropriationId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                        <option value="">Selecione...</option>
                        {appropriations.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.expenseNature?.name}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t mt-6">
                <button type="button" onClick={() => setIsBenefitModalOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Salvar Benefício</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isProgramModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Novo Programa Governamental</h2>
              <button onClick={() => setIsProgramModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            
            <form onSubmit={handleSaveProgram} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Nome do Programa</label>
                  <input required type="text" value={programData.name} onChange={e => setProgramData({...programData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Esfera Governamental</label>
                  <select value={programData.sphere} onChange={e => setProgramData({...programData, sphere: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="Municipal">Municipal</option>
                    <option value="Estadual">Estadual</option>
                    <option value="Federal">Federal</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Descrição</label>
                  <textarea rows={2} value={programData.description} onChange={e => setProgramData({...programData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                
                <hr className="my-2" />
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="pExpense" checked={programData.hasExpense} onChange={e => setProgramData({...programData, hasExpense: e.target.checked})} className="rounded text-blue-600 focus:ring-blue-600" />
                  <label htmlFor="pExpense" className="text-sm font-semibold text-slate-800">Vincular Custo / Despesa (Integração Finanças)</label>
                </div>
                
                {programData.hasExpense && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Descrição da Despesa</label>
                      <input required type="text" value={programData.expenseDesc} onChange={e => setProgramData({...programData, expenseDesc: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">Valor Estimado (R$)</label>
                      <input required type="number" step="0.01" value={programData.expenseValue} onChange={e => setProgramData({...programData, expenseValue: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">Secretaria (Ordenadora)</label>
                      <select required value={programData.secretariatId} onChange={e => setProgramData({...programData, secretariatId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                        <option value="">Selecione...</option>
                        {secretariats.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Dotação Orçamentária</label>
                      <select required value={programData.appropriationId} onChange={e => setProgramData({...programData, appropriationId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                        <option value="">Selecione...</option>
                        {appropriations.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.expenseNature?.name}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t mt-6">
                <button type="button" onClick={() => setIsProgramModalOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Salvar Programa</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </PageFrame>
  );
}
