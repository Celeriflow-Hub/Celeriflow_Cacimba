"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./RhWorkspace.module.css";
import { 
  Users, 
  Wallet,
  Clock,
  CalendarDays,
  LayoutDashboard,
  ArrowLeft,
  Menu,
  X,
  UserPlus,
  Gift,
  HeartPulse,
  FileSignature,
  SlidersHorizontal
} from "lucide-react";

const sidebarNavItems = [
  { title: "Painel RH", href: "/rh", icon: LayoutDashboard },
  { title: "Servidores", href: "/rh/servidores", icon: Users },
  { title: "Dependentes", href: "/rh/dependentes", icon: UserPlus },
  { title: "Folha de Pagamento", href: "/rh/folha", icon: Wallet },
  { title: "Parametrizações", href: "/rh/parametrizacoes", icon: SlidersHorizontal },
  { title: "Benefícios", href: "/rh/beneficios", icon: Gift },
  { title: "Registro de Ponto", href: "/rh/ponto", icon: Clock },
  { title: "Férias", href: "/rh/ferias", icon: CalendarDays },
  { title: "Licenças", href: "/rh/licencas", icon: HeartPulse },
  { title: "Atos de Pessoal", href: "/rh/atos", icon: FileSignature },
];

export default function RhLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  return (
    <div data-module-shell className={`${styles.workspace} relative -my-2 -mx-2 flex min-h-0 w-[calc(100%+1rem)] flex-1 flex-col bg-slate-50 dark:bg-slate-950 sm:-my-3 sm:-mx-3 sm:w-[calc(100%+1.5rem)] md:flex-row`}>
      
      {/* Mobile Header with Hamburger */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900 md:hidden">
        <div>
          <h2 className="text-sm font-bold leading-tight text-slate-800 dark:text-white">RH e Folha</h2>
        </div>
         <button
           onClick={() => setIsSidebarOpen(!isSidebarOpen)}
           aria-label="Alternar menu de RH e Folha"
           aria-expanded={isSidebarOpen}
             className="flex size-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        ${isDesktopCollapsed ? 'md:w-[80px]' : 'md:w-[260px]'} 
        absolute inset-x-0 top-11 bottom-0 w-full md:relative md:inset-auto md:shrink-0 md:border-r border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-900 shadow-[2px_0_8px_rgba(0,0,0,0.02)] z-20 flex min-h-0 flex-col transition-all duration-300
        ${isSidebarOpen ? 'block' : 'hidden md:flex'}
      `}>
        <div className="absolute top-4 right-[-14px] hidden md:flex items-center justify-center">
          <button 
            aria-label={isDesktopCollapsed ? "Expandir menu de RH" : "Recolher menu de RH"}
            aria-expanded={!isDesktopCollapsed}
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            className="p-1 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 shadow-sm"
          >
            {isDesktopCollapsed ? <Menu className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        <div className={`mb-5 px-2 hidden md:block ${isDesktopCollapsed ? 'text-center' : ''}`}>
          {!isDesktopCollapsed && (
            <>
              <h2 className="text-base font-bold tracking-tight text-slate-800 dark:text-white">RH e Folha</h2>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Gestão Pública</p>
            </>
          )}
          {isDesktopCollapsed && (
            <Users className="w-6 h-6 mx-auto text-slate-700" />
          )}
        </div>
        
        <nav aria-label="RH e Folha" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {sidebarNavItems.map((item) => {
            const isActive = item.href === "/rh" 
              ? pathname === "/rh" 
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.title}
                aria-label={item.title}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-all duration-200 outline-none ${
                  isActive
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-violet-600/50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
              >
                <item.icon className={`shrink-0 h-[18px] w-[18px] ${isActive ? "text-white" : "text-slate-400"}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className={isDesktopCollapsed ? "md:hidden" : ""}>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Menu items */}
        <div className="mt-4 border-t border-slate-100 pt-4">
          <Link
            href="/dashboard"
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className="shrink-0 h-[18px] w-[18px] text-slate-400" strokeWidth={2} />
            <span className={isDesktopCollapsed ? "md:hidden" : ""}>Voltar ao Dashboard</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
