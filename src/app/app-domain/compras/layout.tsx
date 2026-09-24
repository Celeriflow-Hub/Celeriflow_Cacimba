"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShoppingCart, 
  FileText,
  ClipboardList,
  Scale,
  Gavel,
  PackageCheck,
  LayoutDashboard,
  ArrowLeft,
  Menu,
  X,
  SearchCheck,
  CalendarDays
} from "lucide-react";

const sidebarNavItems = [
  { title: "Painel de Compras", href: "/compras", icon: LayoutDashboard },
  { title: "Solicitações", href: "/compras/solicitacoes", icon: ShoppingCart },
  { title: "Planejamento", href: "/compras/planejamento", icon: CalendarDays },
  { title: "Pesquisas de Preços", href: "/compras/pesquisas-precos", icon: SearchCheck },
  { title: "Processos de Compra", href: "/compras/processos", icon: ClipboardList },
  { title: "Licitações", href: "/compras/licitacoes", icon: Gavel },
  { title: "Contratos", href: "/compras/contratos", icon: Scale },
  { title: "Recebimentos", href: "/compras/recebimentos", icon: PackageCheck },
  { title: "Catálogo de Itens", href: "/compras/catalogo", icon: FileText },
];

export default function ComprasLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const isSupplierPortal = pathname.includes("/compras/pesquisas-precos/portal/");

  if (isSupplierPortal) {
    return <main className="min-h-0 flex-1 bg-slate-50">{children}</main>;
  }

  return (
    <div data-module-shell className="relative -my-2 mx-auto flex h-full min-h-0 w-[calc(100%+1rem)] max-w-[calc(1600px+1rem)] flex-1 flex-col overflow-hidden bg-slate-50/30 sm:-my-3 sm:w-[calc(100%+1.5rem)] sm:max-w-[calc(1600px+1.5rem)] md:flex-row">
      
      {/* Mobile Header with Hamburger */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-slate-200 p-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 leading-tight">Compras e Contratos</h2>
        </div>
         <button
           onClick={() => setIsSidebarOpen(!isSidebarOpen)}
           aria-label="Alternar menu de Compras e Contratos"
           aria-expanded={isSidebarOpen}
           className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        ${isDesktopCollapsed ? 'md:w-[80px]' : 'md:w-[260px]'} 
        w-full md:shrink-0 md:border-r border-slate-200 bg-white py-6 px-4 shadow-[2px_0_8px_rgba(0,0,0,0.02)] z-10 relative flex flex-col transition-all duration-300
        ${isSidebarOpen ? 'block' : 'hidden md:flex'}
      `}>
        <div className="absolute top-4 right-[-14px] hidden md:flex items-center justify-center">
          <button 
            aria-label={isDesktopCollapsed ? "Expandir menu de Compras e Contratos" : "Recolher menu de Compras e Contratos"}
            aria-expanded={!isDesktopCollapsed}
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            className="p-1 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 shadow-sm"
          >
            {isDesktopCollapsed ? <Menu className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        <div className={`mb-8 px-2 hidden md:block ${isDesktopCollapsed ? 'text-center' : ''}`}>
          {!isDesktopCollapsed && (
            <>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">Compras e Contratos</h2>
              <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Gestão Pública</p>
            </>
          )}
          {isDesktopCollapsed && (
            <ShoppingCart className="w-6 h-6 mx-auto text-slate-700" />
          )}
        </div>
        
        <nav className="flex flex-col gap-1.5 flex-1">
          {sidebarNavItems.map((item) => {
            const isActive = item.href === "/compras" 
              ? pathname === "/compras" 
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                title={isDesktopCollapsed ? item.title : undefined}
                aria-label={item.title}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 outline-none ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-emerald-600/50"
                }`}
              >
                <item.icon className={`shrink-0 h-[18px] w-[18px] ${isActive ? "text-white" : "text-slate-400"}`} strokeWidth={isActive ? 2.5 : 2} />
                {!isDesktopCollapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Menu items */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <Link
            href="/dashboard"
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200"
          >
            <ArrowLeft className="shrink-0 h-[18px] w-[18px] text-slate-400" strokeWidth={2} />
            {!isDesktopCollapsed && <span>Voltar ao Dashboard</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-50/50">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 md:p-3">
          {children}
        </div>
      </main>
    </div>
  );
}
