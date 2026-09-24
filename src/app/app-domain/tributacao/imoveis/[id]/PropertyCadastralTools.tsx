"use client";

import Link from "next/link";
import { useState } from "react";
import { Calculator, Copy, Layers3, X } from "lucide-react";
import { calculatePropertyPreviewAction, calculateTerritorialFractionAction, copyPropertyCharacteristics, createCondominiumSubunit } from "../property-actions";

type EstateOption = { id: string; label: string };

export function PropertyCadastralTools({ estateId, landArea, builtArea, estates }: { estateId: string; landArea: number; builtArea: number; estates: EstateOption[] }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<{ venalValue: string; estimatedTax: string | null }>();
  const [fraction, setFraction] = useState("");
  const [createdId, setCreatedId] = useState("");

  async function previewAction(formData: FormData) {
    const result = await calculatePropertyPreviewAction({ estateId, landArea: Number(formData.get("landArea")), builtArea: Number(formData.get("builtArea")), landUnitValue: Number(formData.get("landUnitValue")), constructionUnitValue: Number(formData.get("constructionUnitValue")), factor: Number(formData.get("factor")), taxRate: Number(formData.get("taxRate")) });
    if (result.error) return setMessage(result.error);
    setPreview(result.data); setMessage("Prévia calculada sem alterar cadastro, lançamento ou cobrança.");
  }
  async function fractionAction(formData: FormData) {
    const result = await calculateTerritorialFractionAction({ estateId, unitLandArea: Number(formData.get("unitLandArea")), totalLandArea: Number(formData.get("totalLandArea")) });
    if (result.error) return setMessage(result.error);
    setFraction(result.data?.percentage ?? ""); setMessage("Fração territorial calculada.");
  }
  async function subunitAction(formData: FormData) {
    const result = await createCondominiumSubunit({ parentId: estateId, municipalInsc: String(formData.get("municipalInsc") ?? ""), registration: String(formData.get("registration") ?? ""), unitLabel: String(formData.get("unitLabel") ?? ""), builtArea: Number(formData.get("builtArea")), unitLandArea: Number(formData.get("unitLandArea")) });
    if (result.error) return setMessage(result.error);
    setCreatedId(result.data?.id ?? ""); setFraction(result.data?.fraction ?? ""); setMessage("Subunidade criada e vinculada ao imóvel principal.");
  }
  async function copyAction(formData: FormData) {
    const result = await copyPropertyCharacteristics({ sourceId: String(formData.get("sourceId") ?? ""), targetId: estateId });
    setMessage(result.error ?? `${result.data?.copied ?? 0} característica(s) copiadas para validação.`);
  }

  return <><button type="button" onClick={() => setOpen(true)} className="inline-flex h-7 items-center gap-1 rounded border border-slate-300 bg-white px-2 text-[11px] font-semibold text-slate-700"><Layers3 className="size-3.5" />Ferramentas cadastrais</button>{open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><div className="max-h-[92vh] w-full max-w-4xl overflow-auto rounded-md bg-white shadow-xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3"><h2 className="text-sm font-bold">Ferramentas da ficha imobiliária</h2><button onClick={() => setOpen(false)} aria-label="Fechar"><X className="size-4" /></button></div><div className="grid gap-3 p-4 lg:grid-cols-2">
    <form action={previewAction} className="space-y-2 rounded border border-slate-200 p-3"><h3 className="flex items-center gap-1 text-xs font-bold"><Calculator className="size-4 text-emerald-600" />Prévia do valor venal</h3><div className="grid grid-cols-2 gap-2"><label className="text-[11px]">Área do terreno<input name="landArea" type="number" step="0.0001" min="0" defaultValue={landArea} className="input mt-1" /></label><label className="text-[11px]">Área construída<input name="builtArea" type="number" step="0.0001" min="0" defaultValue={builtArea} className="input mt-1" /></label><label className="text-[11px]">Valor unitário terreno<input name="landUnitValue" required type="number" step="0.000001" min="0" className="input mt-1" /></label><label className="text-[11px]">Valor unitário construção<input name="constructionUnitValue" required type="number" step="0.000001" min="0" className="input mt-1" /></label><label className="text-[11px]">Fator<input name="factor" required type="number" step="0.000001" min="0.000001" defaultValue="1" className="input mt-1" /></label><label className="text-[11px]">Alíquota informativa (%)<input name="taxRate" type="number" step="0.000001" min="0" defaultValue="0" className="input mt-1" /></label></div><button className="h-7 rounded bg-emerald-700 px-3 text-[11px] font-semibold text-white">Calcular prévia</button>{preview && <p className="rounded bg-emerald-50 p-2 text-xs text-emerald-900">Valor venal: <b>R$ {Number(preview.venalValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</b>{preview.estimatedTax && <> · Tributo estimado: <b>R$ {Number(preview.estimatedTax).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</b></>}</p>}</form>
    <form action={fractionAction} className="space-y-2 rounded border border-slate-200 p-3"><h3 className="text-xs font-bold">Fração territorial automática</h3><div className="grid grid-cols-2 gap-2"><label className="text-[11px]">Área da unidade<input name="unitLandArea" required type="number" step="0.0001" min="0" className="input mt-1" /></label><label className="text-[11px]">Área total<input name="totalLandArea" required type="number" step="0.0001" min="0.0001" defaultValue={landArea} className="input mt-1" /></label></div><button className="h-7 rounded bg-emerald-700 px-3 text-[11px] font-semibold text-white">Calcular fração</button>{fraction && <p className="rounded bg-sky-50 p-2 text-xs text-sky-900">Fração: <b>{fraction}%</b></p>}</form>
    <form action={subunitAction} className="space-y-2 rounded border border-slate-200 p-3"><h3 className="text-xs font-bold">Criar subunidade de condomínio</h3><div className="grid grid-cols-2 gap-2"><label className="text-[11px]">Inscrição<input name="municipalInsc" required className="input mt-1" /></label><label className="text-[11px]">Unidade<input name="unitLabel" required placeholder="Bloco A · Unidade 101" className="input mt-1" /></label><label className="text-[11px]">Matrícula<input name="registration" className="input mt-1" /></label><label className="text-[11px]">Área construída<input name="builtArea" required type="number" step="0.0001" min="0" className="input mt-1" /></label><label className="text-[11px]">Área territorial da unidade<input name="unitLandArea" required type="number" step="0.0001" min="0" className="input mt-1" /></label></div><button className="h-7 rounded bg-emerald-700 px-3 text-[11px] font-semibold text-white">Criar e vincular</button>{createdId && <Link href={`/tributacao/imoveis/${createdId}`} className="ml-2 text-[11px] font-semibold text-emerald-700 underline">Abrir subunidade</Link>}</form>
    <form action={copyAction} className="space-y-2 rounded border border-slate-200 p-3"><h3 className="flex items-center gap-1 text-xs font-bold"><Copy className="size-4 text-emerald-600" />Copiar características</h3><label className="text-[11px]">Imóvel de origem<select name="sourceId" required className="input mt-1"><option value="">Selecione</option>{estates.filter((item) => item.id !== estateId).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><p className="text-[10px] text-slate-500">BCI, áreas, características e atributos são copiados como proposta sujeita à validação.</p><button className="h-7 rounded bg-emerald-700 px-3 text-[11px] font-semibold text-white">Copiar para esta ficha</button></form>
    {message && <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 lg:col-span-2">{message}</p>}
  </div></div></div>}</>;
}
