"use client";

import { useState } from "react";
import type { Institution } from "@prisma/client";
import Image from "next/image";
import { saveInstitution } from "./actions";
import { Save, Building2 } from "lucide-react";

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export function InstitutionForm({ institution }: { institution: Institution | null }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [cnpj, setCnpj] = useState(institution?.cnpj || "");
  const [zipCode, setZipCode] = useState(institution?.zipCode || "");
  const [phone, setPhone] = useState(institution?.phone || "");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 14) value = value.substring(0, 14);

    let formatted = value;
    if (value.length > 12) formatted = `${value.substring(0, 2)}.${value.substring(2, 5)}.${value.substring(5, 8)}/${value.substring(8, 12)}-${value.substring(12, 14)}`;
    else if (value.length > 8) formatted = `${value.substring(0, 2)}.${value.substring(2, 5)}.${value.substring(5, 8)}/${value.substring(8, 12)}`;
    else if (value.length > 5) formatted = `${value.substring(0, 2)}.${value.substring(2, 5)}.${value.substring(5, 8)}`;
    else if (value.length > 2) formatted = `${value.substring(0, 2)}.${value.substring(2, 5)}`;
    setCnpj(formatted);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.substring(0, 11);

    let formatted = value;
    if (value.length > 10) formatted = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7, 11)}`;
    else if (value.length > 6) formatted = `(${value.substring(0, 2)}) ${value.substring(2, 6)}-${value.substring(6, 10)}`;
    else if (value.length > 2) formatted = `(${value.substring(0, 2)}) ${value.substring(2, 7)}`;
    else if (value.length > 0) formatted = `(${value.substring(0, 2)}`;
    setPhone(formatted);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    const result = await saveInstitution(new FormData(event.currentTarget));
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Dados salvos com sucesso!" });
      window.location.reload();
    }
    setLoading(false);
  }

  const imageSrc = previewImage ?? institution?.logoUrl;
  const labelClassName = "block text-[10px] font-bold uppercase tracking-[0.07em] text-slate-600";
  const inputClassName = "h-8 w-full rounded border border-slate-300 bg-white px-2.5 text-xs text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15";

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data" className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
      <div className="flex h-10 items-center gap-2 border-b border-slate-200 bg-slate-50 px-3">
        <div className="flex size-7 items-center justify-center rounded bg-blue-100 text-blue-700">
          <Building2 className="size-4" />
        </div>
        <h2 className="text-sm font-bold text-slate-800">Cadastro institucional</h2>
      </div>

      {message.text && (
        <div className={`mx-3 mt-2 rounded border px-2.5 py-1.5 text-xs font-medium ${message.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_8rem] lg:grid-cols-[minmax(0,1fr)_10rem] xl:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="space-y-3">
          <section>
            <h3 className="mb-2 border-b border-slate-200 pb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">Identificação e gestão</h3>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-1 xl:col-span-2">
                <label htmlFor="institution-name" className={labelClassName}>Nome oficial ou fantasia *</label>
                <input id="institution-name" type="text" name="name" required defaultValue={institution?.name || ""} placeholder="Ex.: Prefeitura Municipal de Tangará" className={inputClassName} />
              </div>
              <div className="space-y-1">
                <label htmlFor="institution-legal-name" className={labelClassName}>Razão social</label>
                <input id="institution-legal-name" type="text" name="legalName" defaultValue={institution?.legalName || ""} className={inputClassName} />
              </div>
              <div className="space-y-1">
                <label htmlFor="institution-cnpj" className={labelClassName}>CNPJ</label>
                <input id="institution-cnpj" type="text" name="cnpj" value={cnpj} onChange={handleCnpjChange} placeholder="00.000.000/0001-00" className={inputClassName} />
              </div>
              <div className="space-y-1">
                <label htmlFor="institution-mayor" className={labelClassName}>Prefeito(a) atual</label>
                <input id="institution-mayor" type="text" name="mayorName" defaultValue={institution?.mayorName || ""} className={inputClassName} />
              </div>
              <div className="space-y-1">
                <label htmlFor="institution-manager" className={labelClassName}>Responsável administrativo</label>
                <input id="institution-manager" type="text" name="managerName" defaultValue={institution?.managerName || ""} className={inputClassName} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-2 border-b border-slate-200 pb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">Contato e endereço</h3>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-1">
                <label htmlFor="institution-phone" className={labelClassName}>Telefone</label>
                <input id="institution-phone" type="text" name="phone" value={phone} onChange={handlePhoneChange} placeholder="(00) 00000-0000" className={inputClassName} />
              </div>
              <div className="space-y-1">
                <label htmlFor="institution-email" className={labelClassName}>E-mail institucional</label>
                <input id="institution-email" type="email" name="email" defaultValue={institution?.email || ""} placeholder="contato@prefeitura.gov.br" className={inputClassName} />
              </div>
              <div className="space-y-1">
                <label htmlFor="institution-website" className={labelClassName}>Site institucional</label>
                <input id="institution-website" type="url" name="website" defaultValue={institution?.website || ""} placeholder="https://prefeitura.gov.br" className={inputClassName} />
              </div>
              <div className="space-y-1 md:col-span-2 xl:col-span-3">
                <label htmlFor="institution-address" className={labelClassName}>Endereço completo</label>
                <input id="institution-address" type="text" name="address" defaultValue={institution?.address || ""} className={inputClassName} />
              </div>
              <div className="space-y-1">
                <label htmlFor="institution-city" className={labelClassName}>Cidade</label>
                <input id="institution-city" type="text" name="city" defaultValue={institution?.city || ""} className={inputClassName} />
              </div>
              <div className="space-y-1">
                <label htmlFor="institution-state" className={labelClassName}>Estado (UF)</label>
                <select id="institution-state" name="state" defaultValue={institution?.state || ""} className={inputClassName}>
                  <option value="">Selecione</option>
                  {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="institution-zip-code" className={labelClassName}>CEP</label>
                <input id="institution-zip-code" type="text" name="zipCode" value={zipCode} onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="00000000" inputMode="numeric" className={inputClassName} />
              </div>
            </div>
          </section>
        </div>

        <aside className="flex flex-col border border-slate-200 bg-slate-50 p-2.5">
          <div>
            <h3 className="text-xs font-bold text-slate-800">Brasão ou logo</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">Documentos e cabeçalho.</p>
          </div>
          <div className="my-2 flex flex-1 items-center justify-center rounded border border-dashed border-slate-300 bg-white p-2">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex size-20 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50">
                {imageSrc ? <Image src={imageSrc} alt="Prévia do brasão" width={80} height={80} unoptimized className="size-full object-contain p-1" /> : <span className="px-2 text-[11px] text-slate-400">Sem imagem</span>}
              </div>
              {institution?.logoUrl && !previewImage && <span className="text-[11px] font-medium text-slate-500">Imagem atual</span>}
            </div>
          </div>
          <label htmlFor="institution-logo" className={labelClassName}>Selecionar arquivo</label>
          <input
            id="institution-logo"
            type="file"
            name="logoFile"
            accept="image/png,image/jpeg"
            onChange={(e) => setPreviewImage(e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : null)}
            className="mt-1 w-full cursor-pointer rounded border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-600 file:mr-2 file:rounded file:border-0 file:bg-blue-50 file:px-2 file:py-1 file:text-[11px] file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="mt-1 text-[11px] leading-snug text-slate-500">PNG ou JPG, com até 2 MB.</p>
        </aside>
      </div>

      <div className="flex h-10 items-center justify-between border-t border-slate-200 bg-slate-50 px-3">
        <span className="text-[11px] text-slate-500">* Campo obrigatório</span>
        <button type="submit" disabled={loading} className="inline-flex h-7 items-center gap-1.5 rounded bg-blue-700 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 disabled:opacity-50">
          <Save className="size-3.5" />
          {loading ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
