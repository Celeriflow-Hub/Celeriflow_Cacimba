"use client";

import { useState, useTransition } from "react";
import { 
  Blocks, Search, CheckCircle2, Lock, Unlock, 
  Building2, Users, FileText, ShoppingCart, DollarSign, 
  Package, Receipt, Stethoscope, GraduationCap, HeartHandshake, HardHat, 
  Trees, Shield, Droplets, Landmark, Palette, Share2, Settings, AlertCircle, RefreshCw, Truck, BadgeCheck
} from "lucide-react";
import { toggleModulo } from "../actions";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export type ModuloItem = {
  id: string;
  nome: string;
  codigo: string;
  ativo: boolean;
  dataAtivacao: Date | string | null;
};

// Module visual mapping
const MODULE_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  ADMINISTRACAO: { icon: Building2, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/50" },
  CADASTROS: { icon: FileText, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900" },
  PROCESSOS: { icon: Share2, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-950/50" },
  DOCUMENTOS: { icon: FileText, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/50" },
  ATENDIMENTO: { icon: Users, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/50" },
  TRANSPARENCIA: { icon: Share2, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-950/50" },
  TRIBUTACAO: { icon: Receipt, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/50" },
  FINANCEIRO: { icon: DollarSign, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/50" },
  COMPRAS: { icon: ShoppingCart, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/50" },
  RH: { icon: Users, color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-950/50" },
  PORTAL_SERVIDOR: { icon: BadgeCheck, color: "text-sky-700 dark:text-sky-300", bg: "bg-sky-50 dark:bg-sky-950/50" },
  PATRIMONIO: { icon: Package, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/50" },
  EDUCACAO: { icon: GraduationCap, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/50" },
  SAUDE: { icon: Stethoscope, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/50" },
  SOCIAL: { icon: HeartHandshake, color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-950/50" },
  MEIO_AMBIENTE: { icon: Trees, color: "text-lime-600 dark:text-lime-400", bg: "bg-lime-50 dark:bg-lime-950/50" },
  SANEAMENTO: { icon: Droplets, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/50" },
  OBRAS: { icon: HardHat, color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/50" },
  FROTAS: { icon: Truck, color: "text-teal-700 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-950/50" },
  CULTURA: { icon: Palette, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/50" },
  CAMARA: { icon: Landmark, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/50" },
  SEGURANCA: { icon: Shield, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-950/50" },
  CONFIGURACOES: { icon: Settings, color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-800" },
};

export default function ModulosClient({ initialModulos }: { initialModulos: ModuloItem[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = initialModulos.filter((m) => {
    const matchesSearch = 
      m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === "ACTIVE") return matchesSearch && m.ativo;
    if (filterStatus === "INACTIVE") return matchesSearch && !m.ativo;
    return matchesSearch;
  });

  const totalAtivos = initialModulos.filter((m) => m.ativo).length;
  const totalInativos = initialModulos.length - totalAtivos;

  const handleToggle = (id: string, currentStatus: boolean) => {
    setLoadingId(id);
    startTransition(async () => {
      try {
        await toggleModulo(id, !currentStatus);
      } catch (err) {
        console.error("Erro ao alterar módulo:", err);
      } finally {
        setLoadingId(null);
      }
    });
  };

  return (
    <PageFrame className="space-y-3 px-1 py-1 md:px-2">
      <PageHeader title="Módulos contratados" icon={<Blocks className="size-4 shrink-0 text-slate-700 dark:text-slate-300" />} className="dark:border-slate-700 dark:bg-slate-800 dark:[&>h1]:text-white" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{totalAtivos} de {initialModulos.length} ativos. Ative ou bloqueie o acesso conforme o plano contratado.</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="rounded-md bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Blocks className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total de Módulos</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{initialModulos.length}</h3>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="rounded-md bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <Unlock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Liberados / Contratados</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalAtivos}</h3>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="rounded-md bg-rose-50 p-2 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Bloqueados / Não Contratados</p>
            <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400">{totalInativos}</h3>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 sm:text-sm">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Como funciona a liberação de módulos:</span> Ao desativar um módulo nesta tela, o card correspondente na página inicial do sistema ficará <strong>escurecido com um ícone de cadeado 🔒</strong>, impedindo a entrada de usuários nas subpáginas. As rotas internas de integração continuam preservadas no banco de dados.
        </div>
      </div>

      {/* Filters and Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar módulo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 sm:flex-initial ${
                filterStatus === "ALL"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Todos ({initialModulos.length})
            </button>
            <button
              onClick={() => setFilterStatus("ACTIVE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 sm:flex-initial ${
                filterStatus === "ACTIVE"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Contratados ({totalAtivos})
            </button>
            <button
              onClick={() => setFilterStatus("INACTIVE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 sm:flex-initial ${
                filterStatus === "INACTIVE"
                  ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Bloqueados ({totalInativos})
            </button>
          </div>
        </div>

        {/* Modules Grid / Cards */}
        <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">
              Nenhum módulo encontrado para os filtros selecionados.
            </div>
          ) : (
            filtered.map((modulo) => {
              const upperCode = modulo.codigo.toUpperCase();
              const isConfig = upperCode === "CONFIGURACOES";
              const visualConfig = MODULE_ICONS[upperCode] || {
                icon: Blocks,
                color: "text-slate-700 dark:text-slate-300",
                bg: "bg-slate-100 dark:bg-slate-800",
              };
              const IconComp = visualConfig.icon;
              const isLoading = loadingId === modulo.id;

              return (
                <div
                  key={modulo.id}
                  className={`relative flex flex-col justify-between rounded-lg border p-4 transition-all ${
                    modulo.ativo
                      ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300"
                      : "bg-slate-50/70 dark:bg-slate-950/50 border-slate-200 dark:border-slate-900 opacity-80"
                  }`}
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${visualConfig.bg} ${visualConfig.color}`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                            {modulo.nome}
                          </h3>
                          <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                            CÓD: {modulo.codigo}
                          </span>
                        </div>
                      </div>

                      {/* Status Pill */}
                      {modulo.ativo ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Contratado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 shrink-0">
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                          Bloqueado
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {isConfig
                        ? "Módulo essencial do sistema para parâmetros e administração do tenant."
                        : `Módulo oficial de ${modulo.nome} com fluxos de processos e rotas operacionais.`}
                    </p>
                  </div>

                  {/* Bottom Controls */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {modulo.dataAtivacao
                        ? `Ativado em: ${new Date(modulo.dataAtivacao).toLocaleDateString("pt-BR")}`
                        : "Não ativado"}
                    </span>

                    {isConfig ? (
                      <span className="text-[11px] font-semibold text-slate-400 italic">
                        Sempre Ativo
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isLoading || isPending}
                        onClick={() => handleToggle(modulo.id, modulo.ativo)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 ${
                          modulo.ativo ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                        } ${isLoading ? "opacity-60 cursor-wait" : ""}`}
                      >
                        <span className="sr-only">Alternar status do módulo</span>
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                            modulo.ativo ? "translate-x-5" : "translate-x-0"
                          }`}
                        >
                          {isLoading && <RefreshCw className="w-3 h-3 text-slate-600 animate-spin" />}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </PageFrame>
  );
}
