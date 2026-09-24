"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { acquireAssetFromReceiptAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ReferencePicker } from "@/app/app-domain/frotas/ReferencePicker";

type ReceiptItem = {
  id: string;
  label: string;
  remaining: number;
  name: string;
  description: string | null;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
};
type Option = { id: string; name: string };

export function AssetReceiptForm({ categories, departments }: { categories: Option[]; departments: Option[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [search, setSearch] = useState("");
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ReceiptItem | null>(null);
  const [suggestedPatrimonyNumber, setSuggestedPatrimonyNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [responsibleLabel, setResponsibleLabel] = useState("");
  const [data, setData] = useState({ purchaseReceiptItemId: "", categoryId: "", departmentId: "", responsibleId: "" });

  useEffect(() => {
    const query = search.trim();
    if (query.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setSearchError(null);
      try {
        const response = await fetch(`/api/patrimonio/recebimentos?${new URLSearchParams({ q: query })}`, { signal: controller.signal });
        const result = await response.json().catch(() => ({ error: "Não foi possível consultar os itens recebidos." }));
        if (!response.ok) throw new Error(result.error || "Não foi possível consultar os itens recebidos.");
        setReceiptItems(result.options || []);
        setSuggestedPatrimonyNumber(result.suggestedPatrimonyNumber || null);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setSearchError(requestError instanceof Error ? requestError.message : "Não foi possível consultar os itens recebidos.");
          setReceiptItems([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await acquireAssetFromReceiptAction(data);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/patrimonio/bens");
    } finally {
      setPending(false);
    }
  }

  function chooseReceiptItem(item: ReceiptItem) {
    setSelectedItem(item);
    setData((current) => ({ ...current, purchaseReceiptItemId: item.id }));
    setSearch(item.label);
    setReceiptItems([]);
    setError(null);
  }

  function updateSearch(value: string) {
    setSearch(value);
    if (value.trim().length < 2) {
      setReceiptItems([]);
      setSearchError(null);
      setLoading(false);
    }
    if (selectedItem && value !== selectedItem.label) {
      setSelectedItem(null);
      setSuggestedPatrimonyNumber(null);
      setData((current) => ({ ...current, purchaseReceiptItemId: "" }));
      setError(null);
    }
  }

  return (
    <PageFrame className="max-w-5xl space-y-2">
      <PageHeader title="Tombar Bem Recebido" action={<Link href="/patrimonio/bens" aria-label="Voltar"><Button variant="outline" size="sm">Cancelar</Button></Link>} />
      <form onSubmit={submit} className="grid gap-3 rounded-md border bg-white p-3 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="receipt-search">Buscar item recebido</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input id="receipt-search" type="search" value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Busque por recebimento, código, nome, marca, modelo ou série" className="pl-9" autoComplete="off" />
          </div>
          <p className="text-xs text-muted-foreground">Digite ao menos dois caracteres e selecione o item com saldo disponível.</p>
          {loading && <p className="text-xs text-slate-500">Consultando itens recebidos...</p>}
          {searchError && <p role="alert" className="text-xs text-rose-700">{searchError}</p>}
          {receiptItems.length > 0 && (
            <div role="listbox" aria-label="Resultados de itens recebidos" className="max-h-52 overflow-auto rounded-md border border-slate-200 bg-white p-1 shadow-sm">
              {receiptItems.map((item) => (
                <button key={item.id} type="button" role="option" aria-selected={item.id === data.purchaseReceiptItemId} onClick={() => chooseReceiptItem(item)} className="flex w-full items-start justify-between gap-3 rounded px-3 py-2 text-left text-sm hover:bg-emerald-50 focus-visible:bg-emerald-50 focus-visible:outline-none">
                  <span className="min-w-0"><span className="block truncate font-medium text-slate-800">{item.label}</span><span className="block text-xs text-slate-500">{item.brand || "Marca não informada"}{item.model ? ` · ${item.model}` : ""}{item.serialNumber ? ` · Série ${item.serialNumber}` : ""}</span></span>
                  <span className="shrink-0 text-xs font-semibold text-emerald-700">{item.remaining} disponível(is)</span>
                </button>
              ))}
            </div>
          )}
          {search.trim().length >= 2 && !loading && !searchError && receiptItems.length === 0 && !selectedItem && <p className="text-xs text-slate-500">Nenhum item aprovado com saldo disponível foi encontrado.</p>}
        </div>

        <div className="space-y-2"><Label>Número de tombamento</Label><Input value={selectedItem ? suggestedPatrimonyNumber || "Será definido ao registrar" : "Selecione um item recebido"} readOnly /></div>
        <div className="space-y-2"><Label>Nome do bem</Label><Input value={selectedItem?.name || "Selecione um item recebido"} readOnly /></div>
        <div className="space-y-2"><Label>Marca</Label><Input value={selectedItem?.brand || "Não informada no recebimento"} readOnly /></div>
        <div className="space-y-2"><Label>Modelo</Label><Input value={selectedItem?.model || "Não informado no recebimento"} readOnly /></div>
        <div className="space-y-2"><Label>Número de série</Label><Input value={selectedItem?.serialNumber || "Não informado no recebimento"} readOnly /></div>
        <div className="space-y-2"><Label>Descrição recebida</Label><Input value={selectedItem?.description || "Não informada no recebimento"} readOnly /></div>
        <div className="space-y-2">
          <Label htmlFor="asset-category">Categoria patrimonial</Label>
          <select id="asset-category" required value={data.categoryId} onChange={(event) => setData((current) => ({ ...current, categoryId: event.target.value }))} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Selecione a categoria</option>
            {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="asset-department">Setor responsável</Label>
          <select id="asset-department" value={data.departmentId} onChange={(event) => { setResponsibleLabel(""); setData((current) => ({ ...current, departmentId: event.target.value, responsibleId: "" })); }} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Não alocar agora</option>
            {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Servidor responsável</Label>
          {data.departmentId ? <ReferencePicker endpoint="/api/patrimonio/referencias" kind="patrimonioEmployees" departmentId={data.departmentId} label="Servidor responsável" value={data.responsibleId} selectedLabel={responsibleLabel} onChange={(responsibleId, label) => { setResponsibleLabel(label || ""); setData((current) => ({ ...current, responsibleId })); }} /> : <p className="text-xs text-slate-500">Selecione o setor responsável para pesquisar um servidor vinculado a ele.</p>}
        </div>
        {error && <p role="alert" className="text-sm text-rose-700 md:col-span-2">{error}</p>}
        <div className="flex justify-end gap-2 border-t pt-3 md:col-span-2"><Link href="/patrimonio/bens"><Button type="button" variant="outline">Cancelar</Button></Link><Button type="submit" disabled={pending || !data.purchaseReceiptItemId || !data.categoryId}>{pending ? "Tombando..." : "Registrar tombamento"}</Button></div>
      </form>
    </PageFrame>
  );
}
