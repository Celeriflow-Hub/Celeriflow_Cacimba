"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import {
  LogOut,
  Landmark,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_VERSION } from "@/lib/version";
import UsageAuditTracker from "@/components/platform/UsageAuditTracker";

type UserInfo = {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  role: string;
};

function getRoleLabel(role: string) {
  return role;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ClientLayout({
  children,
  institution,
  user,
}: {
  children: React.ReactNode;
  institution?: { name?: string | null; logoUrl?: string | null } | null;
  user?: UserInfo | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login" || pathname === "/";

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/session/logout", { method: "POST" });
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  const userName = user?.name ?? "Usuário";
  const userRole = user?.role ? getRoleLabel(user.role) : "Gestor do Sistema";
  const initials = getInitials(userName);
  const isFixedRhWorkspace = pathname === "/rh" || pathname.startsWith("/rh/");
  const fixedComprasRoutes = [
    "/compras/catalogo",
    "/compras/contratos",
    "/compras/convenios",
    "/compras/exportacoes",
    "/compras/licitacoes",
    "/compras/pesquisas-precos",
    "/compras/planejamento",
    "/compras/processos",
    "/compras/solicitacoes",
  ];
  const isFixedComprasWorkspace = fixedComprasRoutes.includes(pathname);
  const fixedLote2Routes = [
    "/financeiro/automacoes", "/financeiro/conciliacao-bancaria", "/financeiro/contabilidade",
    "/financeiro/contas-bancarias", "/financeiro/download-extratos", "/financeiro/empenhos",
    "/financeiro/liquidacoes", "/financeiro/orcamento", "/financeiro/pagamentos",
    "/financeiro/receitas", "/financeiro/receitas-constitucionais", "/financeiro/rendimentos",
    "/financeiro/orcamento/cadastros", "/financeiro/orcamento/planejamento",
    "/tributacao/alvaras", "/tributacao/certidoes", "/tributacao/divida", "/tributacao/economico",
    "/tributacao/fiscalizacao", "/tributacao/guias", "/tributacao/imoveis", "/tributacao/nfse",
    "/saneamento/faturas", "/saneamento/leituras", "/saneamento/portal", "/saneamento/qualidade",
    "/saneamento/servicos", "/saneamento/unidades",
    "/meio-ambiente/areas-verdes", "/meio-ambiente/denuncias", "/meio-ambiente/documentos",
    "/meio-ambiente/educacao", "/meio-ambiente/empreendimentos", "/meio-ambiente/fiscalizacao",
    "/meio-ambiente/licenciamento", "/meio-ambiente/residuos", "/meio-ambiente/solicitacoes",
  ];
  const isFixedLote2Workspace = fixedLote2Routes.includes(pathname);
  const fixedLote3Routes = [
    "/administracao/calendario", "/administracao/cargos", "/administracao/demandas",
    "/administracao/departamentos", "/administracao/secretarias", "/administracao/servidores",
    "/administracao/unidades", "/atendimento/central", "/atendimento/ouvidoria",
    "/cadastros/documentos", "/cadastros/fornecedores", "/cadastros/imoveis",
    "/cadastros/pessoas-fisicas", "/cadastros/pessoas-juridicas",
    "/configuracoes/auditoria", "/configuracoes/perfis", "/configuracoes/processos",
    "/configuracoes/usuarios", "/documentos/assinaturas", "/documentos/ged", "/documentos/modelos",
  ];
  const isFixedLote3Workspace = fixedLote3Routes.includes(pathname);
  const isFixedErpWorkspace = [
    "/protocolos",
    "/protocolos/processos",
    "/protocolos/acompanhamento",
    "/protocolos/arquivados",
    "/protocolos/assinaturas",
    "/protocolos/busca",
    "/protocolos/ouvidoria",
    "/frotas",
    "/portal-servidor",
    "/portal-servidor/documentos",
    "/portal-servidor/ficha-funcional",
    "/portal-servidor/ponto",
    "/portal-servidor/ferias",
    "/portal-servidor/beneficios",
    "/portal-servidor/folha",
    "/patrimonio",
    "/patrimonio/bens",
    "/patrimonio/ciclo-vida",
    "/patrimonio/almoxarifados",
    "/patrimonio/materiais",
    "/patrimonio/requisicoes",
    "/patrimonio/inventarios",
  ].includes(pathname) || isFixedRhWorkspace || isFixedComprasWorkspace || isFixedLote2Workspace || isFixedLote3Workspace;

  return (
    <div className={isFixedErpWorkspace ? "flex h-dvh w-full flex-col overflow-hidden bg-slate-100" : "flex min-h-dvh w-full flex-col bg-slate-100"}>
      <UsageAuditTracker />
      <header className="sticky top-0 z-30 flex h-15 shrink-0 items-center gap-3 border-b border-slate-300 bg-white px-3 shadow-sm sm:px-5">
        <div className="flex min-w-0 flex-1 items-center">
          <Link href="/dashboard" className="flex items-center rounded-sm py-1 outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-emerald-600">
            <Image
              src="/favicon.png"
              alt="CeleriFlow"
              width={148}
              height={50}
              className="h-9 w-auto object-contain sm:h-10"
              priority
            />
          </Link>
        </div>

        <div className="hidden min-w-0 items-center justify-center gap-2.5 md:flex">
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-300 bg-slate-50">
            {institution?.logoUrl ? (
              <Image src={institution.logoUrl} alt="Brasão" width={40} height={40} unoptimized className="w-full h-full object-cover" />
            ) : (
              <Landmark className="size-4 text-slate-700" />
            )}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">Sistema integrado</span>
            <span className="truncate text-sm font-bold uppercase leading-tight text-slate-800">{institution?.name || "Prefeitura Municipal"}</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-3">
          <Link href="/notificacoes" className="rounded-md p-2 text-slate-500 outline-none hover:bg-slate-100 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-600" aria-label="Notificações internas">
            <Bell className="h-5 w-5" />
          </Link>
          <div className="mr-1 hidden min-w-0 flex-col text-right lg:flex">
            <span className="truncate text-sm font-semibold leading-tight text-slate-800">{userName}</span>
            <span className="truncate text-[11px] leading-tight text-slate-500">{userRole}</span>
          </div>

          <div className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-700 text-xs font-bold text-white">
            {initials}
          </div>

          <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

          <Button onClick={handleLogout} variant="ghost" size="sm" className="hidden text-slate-600 hover:bg-red-50 hover:text-destructive sm:flex">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
          <Button onClick={handleLogout} variant="ghost" size="icon" className="shrink-0 text-slate-600 hover:bg-red-50 hover:text-destructive sm:hidden">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className={isFixedErpWorkspace ? "flex min-h-0 flex-1 flex-col overflow-hidden p-2 sm:p-3" : "flex min-h-0 flex-1 flex-col p-2 sm:p-3"}>
        {children}
      </main>

      <footer className="flex shrink-0 flex-col items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-2 text-center text-[11px] text-slate-500 sm:flex-row sm:px-5">
        <span>&copy; {new Date().getFullYear()} CeleriFlow. Todos os direitos reservados.</span>
        <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[10px] font-medium text-slate-500">
          Versão {APP_VERSION}
        </span>
      </footer>
    </div>
  );
}
