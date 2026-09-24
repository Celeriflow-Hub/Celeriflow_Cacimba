"use client";

import { useState } from "react";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { format } from "date-fns";
import { FileText, Plus, Search, Filter, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { createCommitment, updateCommitment, cancelCommitment } from "./actions";

type Commitment = {
  id: string;
  number: string;
  date: Date;
  value: number;
  type: string;
  history: string;
  status: string;
  supplierId: string;
  appropriationId: string;
  supplier: {
    id: string;
    company?: { corporateName: string } | null;
    person?: { fullName: string } | null;
  };
  appropriation: {
    id: string;
    code: string;
    budgetUnit: { name: string };
  };
  financialDocument: { id: string; number: string; title: string } | null;
  obrasServices: { id: string; protocolo: string }[];
  purchaseReceipt: { number: string } | null;
};

type SupplierOption = {
  id: string;
  company?: { corporateName: string } | null;
  person?: { fullName: string } | null;
};

type AppropriationOption = { id: string; code: string; budgetUnit: { name: string } };
type ReservationOption = {
  id: string;
  number: string;
  value: number;
  appropriationId: string;
  appropriation: { code: string };
  expense: {
    supplierId: string | null;
    sourceModule: string;
    sourceType: string;
    sourceId: string | null;
    purchaseReceipt: { number: string; contractId: string; contract: { supplierId: string } } | null;
  } | null;
};
type ProcessOption = { id: string; protocolNumber: string; description: string | null };
type ContractOption = { id: string; number: string; object: string; supplierId: string; status: string };
type ObrasServiceOption = { id: string; protocolo: string; tipo: string; descricao: string; local: string; budgetAppropriationId: string | null; budgetAppropriation: { code: string } | null };
type CovenantOption = { id: string; number: string; grantor: string | null };
type PublicityCampaignOption = { id: string; name: string; agency: string | null };
type FundedDebtOption = { id: string; lawNumber: string; creditorName: string | null };

export default function EmpenhosClient({
  commitments,
  suppliers,
  appropriations,
  reservations,
  processes,
  contracts,
  obrasServices,
  covenants,
  publicityCampaigns,
  fundedDebts,
}: {
  commitments: Commitment[];
  suppliers: SupplierOption[];
  appropriations: AppropriationOption[];
  reservations: ReservationOption[];
  processes: ProcessOption[];
  contracts: ContractOption[];
  obrasServices: ObrasServiceOption[];
  covenants: CovenantOption[];
  publicityCampaigns: PublicityCampaignOption[];
  fundedDebts: FundedDebtOption[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    number: "",
    date: new Date().toISOString().substring(0, 10),
    value: 0,
    type: "Ordinário",
    history: "",
    supplierId: "",
    appropriationId: "",
    reservationId: "",
    processId: "",
    contractId: "",
    obrasServiceId: "",
    covenantId: "",
    publicityCampaignId: "",
    fundedDebtId: "",
  });

  const filteredCommitments = commitments.filter(c =>
    c.number.includes(searchTerm) ||
    c.supplier.company?.corporateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.supplier.person?.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(filteredCommitments.length / pageSize));
  const pagedCommitments = filteredCommitments.slice((page - 1) * pageSize, page * pageSize);

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({
      number: "",
      date: new Date().toISOString().substring(0, 10),
      value: 0,
      type: "Ordinário",
      history: "",
      supplierId: "",
      appropriationId: "",
      reservationId: "",
      processId: "",
      contractId: "",
      obrasServiceId: "",
      covenantId: "",
      publicityCampaignId: "",
      fundedDebtId: "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataToSubmit = {
        ...formData,
        date: new Date(formData.date)
      };

      if (editingId) {
        const result = await updateCommitment(editingId, dataToSubmit);
        if (result.error) throw new Error(result.error);
      } else {
        const result = await createCommitment(dataToSubmit);
        if (result.error) throw new Error(result.error);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving commitment:", error);
      alert("Ocorreu um erro ao salvar o empenho.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelCommitment = async (id: string) => {
    if (window.confirm('Deseja realmente anular este empenho? Esta ação não pode ser desfeita.')) {
      const result = await cancelCommitment(id);
      if (result.error) alert(result.error);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 sm:px-2">
      <div className="flex flex-col gap-2 border-b border-slate-300 bg-white px-3 py-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-900">Empenhos</h1>
          <p className="text-xs text-muted-foreground">Gestão de empenhos da execução orçamentária</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button size="sm" onClick={handleOpenNew}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Empenho
          </Button>
        </div>
      </div>

      <Card size="sm" className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md shadow-none [&_[data-slot=table-container]]:min-h-0 [&_[data-slot=table-container]]:flex-1 [&_[data-slot=table-container]]:overflow-x-hidden [&_[data-slot=table-container]]:overflow-y-auto [&_[data-slot=table]]:table-fixed [&_[data-slot=table-header]]:sticky [&_[data-slot=table-header]]:top-0 [&_[data-slot=table-header]]:z-10 [&_[data-slot=table-row]]:h-[38px]">
        <CardHeader className="border-b pb-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Listagem de Empenhos</CardTitle>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por fornecedor ou número..."
                  className="w-full pl-8 sm:w-[280px]"
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden pt-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Fornecedor/Credor</TableHead>
                <TableHead>Unidade Orçamentária</TableHead>
                <TableHead>Valor (R$)</TableHead>
                <TableHead>Recebimento</TableHead>
                <TableHead>Documento interno</TableHead>
                <TableHead>Obra/OS</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommitments.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground h-32">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="h-8 w-8 mb-2 opacity-20" />
                      Nenhum empenho encontrado.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pagedCommitments.map((commitment) => (
                  <TableRow key={commitment.id}>
                    <TableCell className="font-medium">{commitment.number}</TableCell>
                    <TableCell>{format(new Date(commitment.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      {commitment.supplier.company?.corporateName || commitment.supplier.person?.fullName || 'Não identificado'}
                    </TableCell>
                    <TableCell>{commitment.appropriation.budgetUnit.name}</TableCell>
                    <TableCell>
                       {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commitment.value)}
                    </TableCell>
                    <TableCell className="text-sm">{commitment.purchaseReceipt?.number ?? "-"}</TableCell>
                    <TableCell className="text-sm">{commitment.financialDocument?.number || "-"}</TableCell>
                    <TableCell className="text-sm">{commitment.obrasServices.map((service) => service.protocolo).join(", ") || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={
                        commitment.status === 'Pago' ? 'default' :
                        commitment.status === 'Anulado' ? 'destructive' :
                        'secondary'
                      }>
                        {commitment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleCancelCommitment(commitment.id)} title="Anular" disabled={commitment.status === 'Anulado'}>
                        <Ban className="h-4 w-4 text-rose-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
              <ErpPagination page={Math.min(page, pageCount)} total={filteredCommitments.length} pageSize={pageSize} previousHref="#" nextHref="#" onPageChange={setPage} />
</Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Empenho" : "Novo Empenho"}</DialogTitle>
            <DialogDescription>Todo empenho novo deve consumir uma reserva ativa de mesmo valor.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="number">Número do Empenho</Label>
                <Input id="number" required value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input id="date" type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="obrasServiceId">Obra / ordem de serviço (opcional)</Label>
              <Select value={formData.obrasServiceId} onValueChange={v => setFormData({...formData, obrasServiceId: v as string})}>
                <SelectTrigger><SelectValue placeholder="Sem obra/ordem de serviço" /></SelectTrigger>
                <SelectContent>
                  {obrasServices.filter((service) => !service.budgetAppropriationId || service.budgetAppropriationId === formData.appropriationId).map((service) => <SelectItem key={service.id} value={service.id}>{service.protocolo} - {service.tipo}: {service.descricao}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Somente ordens ativas e ainda não vinculadas podem ser selecionadas.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="covenantId">Convênio (opcional)</Label>
                <Select value={formData.covenantId} onValueChange={value => setFormData({ ...formData, covenantId: value ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="Sem convênio" /></SelectTrigger>
                  <SelectContent>{covenants.map((covenant) => <SelectItem key={covenant.id} value={covenant.id}>{covenant.number} - {covenant.grantor ?? "Concedente não informado"}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="publicityCampaignId">Campanha (opcional)</Label>
                <Select value={formData.publicityCampaignId} onValueChange={value => setFormData({ ...formData, publicityCampaignId: value ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="Sem campanha" /></SelectTrigger>
                  <SelectContent>{publicityCampaigns.map((campaign) => <SelectItem key={campaign.id} value={campaign.id}>{campaign.name} - {campaign.agency ?? "Agência não informada"}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fundedDebtId">Dívida fundada (opcional)</Label>
                <Select value={formData.fundedDebtId} onValueChange={value => setFormData({ ...formData, fundedDebtId: value ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="Sem dívida" /></SelectTrigger>
                  <SelectContent>{fundedDebts.map((debt) => <SelectItem key={debt.id} value={debt.id}>{debt.lawNumber} - {debt.creditorName ?? "Credor não informado"}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v as string})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ordinário">Ordinário</SelectItem>
                    <SelectItem value="Estimativo">Estimativo</SelectItem>
                    <SelectItem value="Global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Valor (R$)</Label>
                  <MoneyInput id="value" required value={formData.value} onChange={val => setFormData({...formData, value: val})} />
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appropriationId">Dotação Orçamentária</Label>
              <Select value={formData.appropriationId} onValueChange={v => setFormData({...formData, appropriationId: v as string})}>
                <SelectTrigger><SelectValue placeholder="Selecione a dotação" /></SelectTrigger>
                <SelectContent>
                  {appropriations.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.code} - {a.budgetUnit.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!editingId && (
              <div className="space-y-2">
                 <Label htmlFor="reservationId">Reserva Orçamentária</Label>
                 <Select value={formData.reservationId} onValueChange={v => {
                   const reservation = reservations.find(r => r.id === v);
                   const expense = reservation?.expense;
                   const receipt = expense?.purchaseReceipt;
                   const contract = expense?.sourceModule === "COMPRAS" && expense.sourceType === "CONTRACT" && expense.sourceId
                     ? contracts.find((item) => item.id === expense.sourceId)
                     : null;
                   setFormData({
                     ...formData,
                     reservationId: v as string,
                     appropriationId: reservation?.appropriationId ?? formData.appropriationId,
                     value: reservation?.value ?? formData.value,
                     supplierId: receipt?.contract.supplierId ?? expense?.supplierId ?? formData.supplierId,
                     contractId: receipt?.contractId ?? contract?.id ?? formData.contractId,
                     history: receipt ? `Recebimento ${receipt.number}` : contract ? `AE do contrato ${contract.number}` : formData.history,
                   });
                 }}>
                  <SelectTrigger><SelectValue placeholder="Selecione a reserva ativa" /></SelectTrigger>
                  <SelectContent>
                     {reservations.map(r => (
                       <SelectItem key={r.id} value={r.id}>{r.number} - {r.appropriation.code} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.value)}{r.expense?.purchaseReceipt ? ` · ${r.expense.purchaseReceipt.number}` : r.expense?.sourceModule === "COMPRAS" && r.expense.sourceType === "CONTRACT" ? " · AE contratual" : ""}</SelectItem>
                     ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="supplierId">Fornecedor / Credor</Label>
              <Select value={formData.supplierId} onValueChange={v => setFormData({...formData, supplierId: v as string})}>
                <SelectTrigger><SelectValue placeholder="Selecione o fornecedor" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.company?.corporateName || s.person?.fullName || 'Fornecedor Sem Nome'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="history">Histórico / Descrição</Label>
              <Input id="history" required value={formData.history} onChange={e => setFormData({...formData, history: e.target.value})} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="processId">Processo (opcional)</Label>
                <Select value={formData.processId} onValueChange={v => setFormData({...formData, processId: v as string})}>
                  <SelectTrigger><SelectValue placeholder="Sem processo" /></SelectTrigger>
                  <SelectContent>
                    {processes.map(process => <SelectItem key={process.id} value={process.id}>{process.protocolNumber}{process.description ? ` - ${process.description}` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractId">Contrato (opcional)</Label>
                <Select value={formData.contractId} onValueChange={v => setFormData({...formData, contractId: v as string})}>
                  <SelectTrigger><SelectValue placeholder="Sem contrato" /></SelectTrigger>
                  <SelectContent>
                    {contracts.filter(contract => !formData.supplierId || contract.supplierId === formData.supplierId).map(contract => <SelectItem key={contract.id} value={contract.id}>{contract.number} - {contract.object}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar Empenho"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
