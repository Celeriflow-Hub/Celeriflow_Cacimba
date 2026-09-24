"use client";

import { useState } from "react";
import { FileText, Plus, Search, Pencil, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MoneyInput } from "@/components/ui/MoneyInput";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { saveCatalogItem, toggleCatalogItemStatus } from "./actions";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpStatusBadge, ErpTableContainer, ErpTableTd, ErpTableTh, ErpTableThead, ErpTableTr } from "@/components/app-ui/erp/ErpTable";

type CatalogItem = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  category: string | null;
  unit: string;
  estimatedValue: number | null;
  isActive: boolean;
};

const pageSize = 20;

export default function CatalogoClient({ items }: { items: CatalogItem[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    category: "",
    unit: "UN",
    estimatedValue: 0,
    isActive: true
  });

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredItems = items.filter(item => {
    const matchesSearch = !normalizedSearch || item.name.toLowerCase().includes(normalizedSearch) ||
      (item.code && item.code.toLowerCase().includes(normalizedSearch)) ||
      (item.category && item.category.toLowerCase().includes(normalizedSearch));
    const matchesStatus = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? item.isActive : !item.isActive);
    return matchesSearch && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      category: "",
      unit: "UN",
      estimatedValue: 0,
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CatalogItem) => {
    setEditingId(item.id);
    setFormData({
      code: item.code || "",
      name: item.name,
      description: item.description || "",
      category: item.category || "",
      unit: item.unit,
      estimatedValue: item.estimatedValue || 0,
      isActive: item.isActive
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataToSave = {
        id: editingId,
        ...formData
      };
      const result = await saveCatalogItem(dataToSave);
      if (result.success) {
        setIsModalOpen(false);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error saving catalog item:", error);
      alert("Ocorreu um erro ao salvar o item do catálogo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (window.confirm(`Deseja ${currentStatus ? 'inativar' : 'ativar'} este item?`)) {
      await toggleCatalogItemStatus(id, !currentStatus);
    }
  };

  return (
    <PageFrame className="flex min-h-0 flex-1 flex-col gap-2 space-y-0">
      <ErpPageTitle title="Catálogo de Itens" icon={<FileText className="size-4 shrink-0 text-emerald-600" />} action={<Button size="sm" onClick={handleOpenNew}><Plus className="size-3.5" /><span className="hidden sm:inline">Novo item</span></Button>} />

      <ErpListFrame
        toolbar={<div className="flex flex-wrap items-center gap-2"><label className="relative min-w-0 flex-1 sm:max-w-md"><span className="sr-only">Buscar item</span><Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" /><input value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }} placeholder="Buscar por código, nome ou categoria" className="h-8 w-full rounded-md border border-slate-200 bg-white pl-8 pr-2.5 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20" /></label><label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">Situação<select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700"><option value="ALL">Todas</option><option value="ACTIVE">Ativos</option><option value="INACTIVE">Inativos</option></select></label></div>}
        summary={<p className="text-[11px] text-slate-600"><strong className="text-slate-900">{filteredItems.length}</strong> item(ns) encontrado(s)</p>}
        pagination={<div className="flex items-center justify-between gap-3 text-[11px] text-slate-600"><span>Página {currentPage} de {totalPages}</span><div className="flex gap-1.5"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} aria-label="Página anterior" className="inline-flex size-7 items-center justify-center rounded border disabled:opacity-40"><ChevronLeft className="size-3.5" /></button><button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage === totalPages} aria-label="Próxima página" className="inline-flex size-7 items-center justify-center rounded border disabled:opacity-40"><ChevronRight className="size-3.5" /></button></div></div>}
      >
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mb-4 opacity-20" />
              <p>Nenhum item encontrado.</p>
              <p className="text-sm">Tente mudar sua busca ou clique em &quot;Novo Item&quot;.</p>
            </div>
          ) : (
            <ErpTableContainer>
                <ErpTableThead><tr><ErpTableTh className="w-[12%]">Código</ErpTableTh><ErpTableTh>Nome</ErpTableTh><ErpTableTh className="hidden w-[22%] lg:table-cell">Descrição</ErpTableTh><ErpTableTh className="w-[16%]">Categoria</ErpTableTh><ErpTableTh className="w-[9%]">Unidade</ErpTableTh><ErpTableTh className="w-[13%] text-right">Valor est.</ErpTableTh><ErpTableTh className="w-[10%]">Status</ErpTableTh><ErpTableTh className="w-20 text-right">Ações</ErpTableTh></tr></ErpTableThead>
                <tbody>
                  {visibleItems.map((item) => (
                    <ErpTableTr key={item.id}>
                      <ErpTableTd className="font-mono font-semibold">{item.code || '-'}</ErpTableTd>
                      <ErpTableTd className="font-semibold" title={item.name}>{item.name}</ErpTableTd>
                      <ErpTableTd className="hidden lg:table-cell" title={item.description || "Sem descrição"}>{item.description || 'Sem descrição'}</ErpTableTd>
                      <ErpTableTd>{item.category || '-'}</ErpTableTd>
                      <ErpTableTd>{item.unit}</ErpTableTd>
                      <ErpTableTd className="text-right tabular-nums">
                        {item.estimatedValue ? 
                          new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.estimatedValue) 
                          : '-'}
                      </ErpTableTd>
                      <ErpTableTd><ErpStatusBadge variant={item.isActive ? 'success' : 'neutral'}>{item.isActive ? 'Ativo' : 'Inativo'}</ErpStatusBadge></ErpTableTd>
                      <ErpTableTd className="text-right">
                        <span className="inline-flex gap-1"><Button variant="ghost" size="icon" className="size-6" onClick={() => handleToggleStatus(item.id, item.isActive)} title={item.isActive ? "Inativar" : "Ativar"}>
                          {item.isActive ? <X className="h-4 w-4 text-rose-500" /> : <Check className="h-4 w-4 text-emerald-500" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="size-6" onClick={() => handleOpenEdit(item)} title="Editar">
                          <Pencil className="h-4 w-4 text-amber-500" />
                        </Button></span>
                      </ErpTableTd>
                    </ErpTableTr>
                  ))}
                </tbody>
              </ErpTableContainer>
          )}
      </ErpListFrame>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Item do Catálogo" : "Novo Item do Catálogo"}</DialogTitle>
            <DialogDescription>Preencha as informações do produto, material ou serviço.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código (Opcional)</Label>
                <Input id="code" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="Ex: MAT-001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria (Opcional)</Label>
                <Input id="category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Ex: Material de Expediente" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Item *</Label>
              <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Papel Sulfite A4" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição Detalhada</Label>
              <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Especificações técnicas ou detalhes adicionais..." className="min-h-[80px]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade de Medida *</Label>
                <Input id="unit" required value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="Ex: UN, CX, PCT, L" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedValue">Valor Estimado (R$)</Label>
                <MoneyInput id="estimatedValue" value={formData.estimatedValue} onChange={val => setFormData({...formData, estimatedValue: val})} />
              </div>
            </div>

            <div className="space-y-2 flex items-center gap-2 pt-2">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="rounded border-slate-300" />
              <Label htmlFor="isActive" className="mb-0 cursor-pointer">Item Ativo no Catálogo</Label>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar Item"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageFrame>
  );
}
