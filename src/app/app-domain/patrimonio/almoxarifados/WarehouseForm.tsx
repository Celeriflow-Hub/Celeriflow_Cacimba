"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ReferencePicker } from "@/app/app-domain/frotas/ReferencePicker";

type CostCenterOption = { id: string; code: string; name: string };
type WarehouseInitialData = {
  name?: string | null;
  type?: string | null;
  address?: string | null;
  zipCode?: string | null;
  streetName?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  managerId?: string | null;
  managerName?: string | null;
  costCenterId?: string | null;
};

export function WarehouseForm({ title, submitLabel, initial, costCenters, action }: {
  title: string;
  submitLabel: string;
  initial?: WarehouseInitialData;
  costCenters: CostCenterOption[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [address, setAddress] = useState({
    zipCode: initial?.zipCode || "",
    streetName: initial?.streetName || "",
    number: initial?.number || "",
    neighborhood: initial?.neighborhood || "",
    city: initial?.city || "",
    state: initial?.state || "",
  });
  const [managerId, setManagerId] = useState(initial?.managerId || "");
  const [managerLabel, setManagerLabel] = useState(initial?.managerName || "");
  const [cepMessage, setCepMessage] = useState<string | null>(null);
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  async function lookupCep() {
    const zipCode = address.zipCode.replace(/\D/g, "");
    if (zipCode.length !== 8) {
      setCepMessage("Informe os oito dígitos do CEP para consultar o endereço.");
      return;
    }
    setIsSearchingCep(true);
    setCepMessage(null);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`);
      const result = await response.json();
      if (!response.ok || result.erro) throw new Error("CEP não encontrado.");
      setAddress((current) => ({
        ...current,
        zipCode,
        streetName: result.logradouro || current.streetName,
        neighborhood: result.bairro || current.neighborhood,
        city: result.localidade || current.city,
        state: result.uf || current.state,
      }));
      setCepMessage("Endereço preenchido a partir do CEP. Informe apenas o número, se necessário.");
    } catch (error) {
      setCepMessage(error instanceof Error ? error.message : "Não foi possível consultar o CEP.");
    } finally {
      setIsSearchingCep(false);
    }
  }

  return (
    <PageFrame className="max-w-4xl space-y-2">
      <PageHeader title={title} action={<Link href="/patrimonio/almoxarifados"><Button size="sm" variant="outline">Cancelar</Button></Link>} />
      <form action={action} className="grid gap-3 rounded-md border bg-white p-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium md:col-span-2">Nome<input name="name" required maxLength={160} defaultValue={initial?.name || ""} className="h-9 rounded-md border bg-background px-3 text-sm" placeholder="Ex.: Almoxarifado Central" /></label>
        <label className="grid gap-1 text-sm font-medium">Tipo<select name="type" defaultValue={initial?.type || "Central"} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="Central">Central</option><option value="Setorial">Setorial</option></select></label>
        <div className="grid gap-1 text-sm font-medium"><Label>Responsável</Label><input type="hidden" name="managerId" value={managerId} /><ReferencePicker endpoint="/api/patrimonio/referencias" kind="patrimonioEmployees" label="Responsável do almoxarifado" value={managerId} selectedLabel={managerLabel} onChange={(id, label) => { setManagerId(id); setManagerLabel(label || ""); }} /></div>
        <label className="grid gap-1 text-sm font-medium md:col-span-2">Centro de custo<select name="costCenterId" defaultValue={initial?.costCenterId || ""} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="">Não vincular agora</option>{costCenters.map((costCenter) => <option key={costCenter.id} value={costCenter.id}>{costCenter.code} · {costCenter.name}</option>)}</select></label>

        <fieldset className="grid gap-3 border-t pt-3 md:col-span-2 md:grid-cols-6">
          <legend className="mb-1 text-sm font-semibold text-slate-800">Endereço</legend>
          {initial?.address && !initial.streetName && !initial.neighborhood && !initial.city && <p className="text-xs text-slate-500 md:col-span-6">Endereço cadastrado anteriormente: {initial.address}. Preencha os campos abaixo para atualizá-lo de forma estruturada.</p>}
          <label className="grid gap-1 text-sm font-medium md:col-span-2">CEP<Input name="zipCode" inputMode="numeric" value={address.zipCode} onChange={(event) => setAddress((current) => ({ ...current, zipCode: event.target.value.replace(/\D/g, "").slice(0, 8) }))} onBlur={() => void lookupCep()} placeholder="00000000" /></label>
          <div className="flex items-end md:col-span-4"><Button type="button" variant="outline" disabled={isSearchingCep} onClick={() => void lookupCep()}>{isSearchingCep ? "Consultando CEP..." : "Buscar CEP"}</Button></div>
          {cepMessage && <p className="text-xs text-slate-500 md:col-span-6">{cepMessage}</p>}
          <label className="grid gap-1 text-sm font-medium md:col-span-4">Rua ou avenida<Input name="streetName" value={address.streetName} onChange={(event) => setAddress((current) => ({ ...current, streetName: event.target.value }))} /></label>
          <label className="grid gap-1 text-sm font-medium md:col-span-2">Número<Input name="number" value={address.number} onChange={(event) => setAddress((current) => ({ ...current, number: event.target.value }))} /></label>
          <label className="grid gap-1 text-sm font-medium md:col-span-2">Bairro<Input name="neighborhood" value={address.neighborhood} onChange={(event) => setAddress((current) => ({ ...current, neighborhood: event.target.value }))} /></label>
          <label className="grid gap-1 text-sm font-medium md:col-span-3">Cidade<Input name="city" value={address.city} onChange={(event) => setAddress((current) => ({ ...current, city: event.target.value }))} /></label>
          <label className="grid gap-1 text-sm font-medium md:col-span-1">UF<Input name="state" maxLength={2} value={address.state} onChange={(event) => setAddress((current) => ({ ...current, state: event.target.value.toUpperCase().slice(0, 2) }))} /></label>
        </fieldset>
        <div className="flex justify-end gap-2 border-t pt-3 md:col-span-2"><Link href="/patrimonio/almoxarifados"><Button type="button" variant="outline">Cancelar</Button></Link><Button type="submit">{submitLabel}</Button></div>
      </form>
    </PageFrame>
  );
}
