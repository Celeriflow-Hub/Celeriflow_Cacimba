"use client";

import { useState } from "react";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { Landmark, Pencil, Plus, Search, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { createBankAccount, updateBankAccount, toggleBankAccountStatus } from "./actions";

type BankAccount = {
  id: string;
  bankName: string;
  agency: string;
  accountNumber: string;
  accountType: string;
  currentBalance: number;
  resourceSourceId: string | null;
  budgetUnitId: string | null;
  accountingPlanId: string | null;
  purpose: string | null;
  isActive: boolean;
  resourceSource?: { id: string; name: string } | null;
  budgetUnit?: { id: string; code: string; name: string } | null;
};

export default function ContasBancariasClient({
  accounts,
  resourceSources,
  budgetUnits,
  accountingPlans,
}: {
  accounts: BankAccount[];
  resourceSources: { id: string; name: string }[];
  budgetUnits: { id: string; code: string; name: string }[];
  accountingPlans: { id: string; code: string; name: string }[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    bankName: "",
    agency: "",
    accountNumber: "",
    accountType: "Movimento",
    currentBalance: 0,
    resourceSourceId: "",
    budgetUnitId: "",
    accountingPlanId: "",
    isActive: true
  });

  const filteredAccounts = accounts.filter(account =>
    account.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.agency.includes(searchTerm) ||
    account.accountNumber.includes(searchTerm) ||
    account.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(filteredAccounts.length / pageSize));
  const pagedAccounts = filteredAccounts.slice((page - 1) * pageSize, page * pageSize);

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({
      bankName: "",
      agency: "",
      accountNumber: "",
      accountType: "Movimento",
      currentBalance: 0,
      resourceSourceId: "",
      budgetUnitId: "",
      accountingPlanId: "",
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (account: BankAccount) => {
    setEditingId(account.id);
    setFormData({
      bankName: account.bankName,
      agency: account.agency,
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      currentBalance: 0,
      resourceSourceId: account.resourceSourceId || "",
      budgetUnitId: account.budgetUnitId || "",
      accountingPlanId: account.accountingPlanId || "",
      isActive: account.isActive
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateBankAccount(editingId, formData);
      } else {
        await createBankAccount(formData);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving account:", error);
      alert("Ocorreu um erro ao salvar a conta bancária.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (window.confirm(`Deseja ${currentStatus ? 'inativar' : 'ativar'} esta conta?`)) {
      await toggleBankAccountStatus(id, !currentStatus);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 sm:px-2">
      <div className="flex flex-col gap-2 border-b border-slate-300 bg-white px-3 py-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-900">Contas Bancárias</h1>
          <p className="text-xs text-muted-foreground">Gestão da tesouraria, com contas separadas por finalidade, área e fonte de recurso.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button size="sm" onClick={handleOpenNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Conta
          </Button>
        </div>
      </div>

      <Card size="sm" className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md shadow-none [&_[data-slot=table-container]]:min-h-0 [&_[data-slot=table-container]]:flex-1 [&_[data-slot=table-container]]:overflow-x-hidden [&_[data-slot=table-container]]:overflow-y-auto [&_[data-slot=table]]:table-fixed [&_[data-slot=table-header]]:sticky [&_[data-slot=table-header]]:top-0 [&_[data-slot=table-header]]:z-10 [&_[data-slot=table-row]]:h-[38px]">
        <CardHeader className="border-b pb-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Listagem de Contas</CardTitle>
              <CardDescription>As contas da POC são segregadas por finalidade operacional, como saúde, educação, convênios, arrecadação e aplicações.</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por banco ou agência..."
                className="w-full pl-8 sm:w-[250px]"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden pt-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banco</TableHead>
                <TableHead>Agência / Conta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Finalidade</TableHead>
                <TableHead>Fonte de Recurso</TableHead>
                <TableHead>Unidade Gestora</TableHead>
                <TableHead>Saldo Atual (R$)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground h-32">
                    <div className="flex flex-col items-center justify-center">
                      <Landmark className="h-8 w-8 mb-2 opacity-20" />
                      Nenhuma conta bancária encontrada.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pagedAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.bankName}</TableCell>
                    <TableCell>{account.agency} / {account.accountNumber}</TableCell>
                    <TableCell>{account.accountType}</TableCell>
                    <TableCell className="max-w-52 whitespace-normal">{account.purpose || "Finalidade não informada"}</TableCell>
                    <TableCell>{account.resourceSource?.name || 'Não vinculada'}</TableCell>
                    <TableCell>{account.budgetUnit ? `${account.budgetUnit.code} - ${account.budgetUnit.name}` : "Não vinculada"}</TableCell>
                    <TableCell className={account.currentBalance < 0 ? "text-rose-500 font-medium" : "text-emerald-500 font-medium"}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.currentBalance)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={account.isActive ? 'default' : 'secondary'}>
                        {account.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(account.id, account.isActive)} title={account.isActive ? "Inativar" : "Ativar"}>
                        {account.isActive ? <X className="h-4 w-4 text-rose-500" /> : <Check className="h-4 w-4 text-emerald-500" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(account)} title="Editar">
                        <Pencil className="h-4 w-4 text-amber-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
              <ErpPagination page={Math.min(page, pageCount)} total={filteredAccounts.length} pageSize={pageSize} previousHref="#" nextHref="#" onPageChange={setPage} />
</Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Conta Bancária" : "Nova Conta Bancária"}</DialogTitle>
            <DialogDescription>O saldo é derivado dos movimentos. O saldo de abertura só pode ser informado na inclusão e fica auditado.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Nome do Banco</Label>
              <Input id="bankName" required value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="agency">Agência</Label>
                <Input id="agency" required value={formData.agency} onChange={e => setFormData({...formData, agency: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Conta</Label>
                <Input id="accountNumber" required value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="accountType">Tipo de Conta</Label>
                <Select value={formData.accountType} onValueChange={v => setFormData({...formData, accountType: v as string})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Movimento">Movimento</SelectItem>
                    <SelectItem value="Vinculada">Vinculada</SelectItem>
                    <SelectItem value="Arrecadação">Arrecadação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!editingId && <div className="space-y-2">
                <Label htmlFor="currentBalance">Saldo Atual (R$)</Label>
                <MoneyInput id="currentBalance" required value={formData.currentBalance} onChange={val => setFormData({...formData, currentBalance: val})} />
              </div>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="resourceSourceId">Fonte de Recurso</Label>
              <Select value={formData.resourceSourceId} onValueChange={v => setFormData({...formData, resourceSourceId: v as string})}>
                <SelectTrigger><SelectValue placeholder="Selecione a fonte" /></SelectTrigger>
                <SelectContent>
                  {resourceSources.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetUnitId">Unidade Gestora</Label>
              <Select value={formData.budgetUnitId} onValueChange={v => setFormData({...formData, budgetUnitId: v as string})}>
                <SelectTrigger><SelectValue placeholder="Selecione a Unidade Gestora" /></SelectTrigger>
                <SelectContent>
                  {budgetUnits.map(unit => (
                    <SelectItem key={unit.id} value={unit.id}>{unit.code} - {unit.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountingPlanId">Conta Analítica do Razão Bancário</Label>
              <Select value={formData.accountingPlanId} onValueChange={v => setFormData({...formData, accountingPlanId: v as string})}>
                <SelectTrigger><SelectValue placeholder="Selecione a conta analítica" /></SelectTrigger>
                <SelectContent>
                  {accountingPlans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>{plan.code} - {plan.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="rounded border-slate-300" />
              <Label htmlFor="isActive" className="mb-0 cursor-pointer">Conta Ativa</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar Conta"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
