import Link from "next/link";
import { 
  Files, 
  HeadphonesIcon, 
  FileText, 
  ShoppingCart, 
  Eye, 
  Building2, 
  Settings,
  Database,
  Landmark,
  CircleDollarSign,
  Users,
  Package,
  GraduationCap,
  HeartPulse,
  Handshake,
  Leaf,
  Droplets,
  HardHat,
  Palette,
  Shield,
  Lock,
  Truck,
  ArrowUpRight,
  BadgeCheck
} from "lucide-react";
import { canShowDashboardCard, canUseInactiveModule, canViewModule, getOptionalTenantContext, isModuleBlockedForUser } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export const dynamic = "force-dynamic";

type MenuItem = {
  code: string;
  accessCode?: string;
  name: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  solid: string;
};

const hiddenDashboardModuleCodes = new Set([
  "CULTURA",
  "DOCUMENTOS",
  "OBRAS",
  "SANEAMENTO",
  "SEGURANCA",
]);

const menuItems: MenuItem[] = [
  { code: "ADMINISTRACAO", name: "Administração", description: "Gestão interna e controle", href: "/administracao", icon: Building2, color: "text-[#2563EB]", bg: "bg-[#DBEAFE]", solid: "bg-[#2563EB]" },
  { code: "CADASTROS", name: "Cadastros", description: "Pessoas, empresas e locais", href: "/cadastros", icon: Database, color: "text-[#64748B]", bg: "bg-[#E2E8F0]", solid: "bg-[#64748B]" },
  { code: "PROCESSOS", name: "Processos e Protocolo", description: "Gestão de trâmites", href: "/protocolos", icon: Files, color: "text-[#0EA5E9]", bg: "bg-[#E0F2FE]", solid: "bg-[#0EA5E9]" },
  { code: "DOCUMENTOS", name: "Documentos / GED", description: "Arquivos e emissões", href: "/documentos", icon: FileText, color: "text-[#F59E0B]", bg: "bg-[#FEF3C7]", solid: "bg-[#F59E0B]" },
  { code: "ATENDIMENTO", name: "Atendimento ao Cidadão", description: "Ouvidoria e chamados", href: "/atendimento", icon: HeadphonesIcon, color: "text-[#F97316]", bg: "bg-[#FFEDD5]", solid: "bg-[#F97316]" },
  { code: "TRANSPARENCIA", name: "Portal e Transparência", description: "Acesso à informação", href: "/transparencia", icon: Eye, color: "text-[#06B6D4]", bg: "bg-[#CFFAFE]", solid: "bg-[#06B6D4]" },
  { code: "TRIBUTACAO", name: "Tributário", description: "Impostos e taxas", href: "/tributacao", icon: Landmark, color: "text-[#059669]", bg: "bg-[#D1FAE5]", solid: "bg-[#059669]" },
  { code: "FINANCEIRO", name: "Financeiro e Contábil", description: "Orçamento e caixa", href: "/financeiro", icon: CircleDollarSign, color: "text-[#16A34A]", bg: "bg-[#DCFCE7]", solid: "bg-[#16A34A]" },
  { code: "CUSTOS", accessCode: "FINANCEIRO", name: "Custos", description: "Análise de despesas e custos", href: "/financeiro", icon: CircleDollarSign, color: "text-[#047857]", bg: "bg-[#D1FAE5]", solid: "bg-[#047857]" },
  { code: "BUSINESS_INTELLIGENCE", accessCode: "ADMINISTRACAO", name: "Bussiness Inteligence", description: "Indicadores e análises gerenciais", href: "/indicadores", icon: Eye, color: "text-[#7C3AED]", bg: "bg-[#EDE9FE]", solid: "bg-[#7C3AED]" },
  { code: "COMUNICACAO", accessCode: "ATENDIMENTO", name: "Comunicação", description: "Notificações e comunicações internas", href: "/notificacoes", icon: HeadphonesIcon, color: "text-[#BE185D]", bg: "bg-[#FCE7F3]", solid: "bg-[#BE185D]" },
  { code: "COMPRAS", name: "Compras e Contratos", description: "Gestão de compras", href: "/compras", icon: ShoppingCart, color: "text-[#9333EA]", bg: "bg-[#F3E8FF]", solid: "bg-[#9333EA]" },
  { code: "RH", name: "RH e Folha", description: "Servidores e folha", href: "/rh", icon: Users, color: "text-[#EC4899]", bg: "bg-[#FCE7F3]", solid: "bg-[#EC4899]" },
  { code: "PORTAL_SERVIDOR", name: "Portal do Servidor", description: "Autosserviço, documentos e solicitações funcionais", href: "/portal-servidor", icon: BadgeCheck, color: "text-[#0F3D61]", bg: "bg-[#E8F0F7]", solid: "bg-[#0F3D61]" },
  { code: "PATRIMONIO", name: "Almoxarifado e Patrimônio", description: "Estoque, bens e inventários", href: "/patrimonio", icon: Package, color: "text-[#D97706]", bg: "bg-[#FEF3C7]", solid: "bg-[#D97706]" },
  { code: "EDUCACAO", name: "Educação", description: "Escolas e alunos", href: "/educacao", icon: GraduationCap, color: "text-[#6366F1]", bg: "bg-[#E0E7FF]", solid: "bg-[#6366F1]" },
  { code: "SAUDE", name: "Saúde", description: "SUS, postos e pacientes", href: "/saude", icon: HeartPulse, color: "text-[#EF4444]", bg: "bg-[#FEE2E2]", solid: "bg-[#EF4444]" },
  { code: "SOCIAL", name: "Assistência Social", description: "Benefícios e CRAS", href: "/social", icon: Handshake, color: "text-[#DB2777]", bg: "bg-[#FCE7F3]", solid: "bg-[#DB2777]" },
  { code: "MEIO_AMBIENTE", name: "Meio Ambiente", description: "Licenças e fiscalização", href: "/meio-ambiente", icon: Leaf, color: "text-[#65A30D]", bg: "bg-[#ECFCCB]", solid: "bg-[#65A30D]" },
  { code: "SANEAMENTO", name: "Água e Saneamento", description: "Água e esgoto", href: "/saneamento", icon: Droplets, color: "text-[#0284C7]", bg: "bg-[#E0F2FE]", solid: "bg-[#0284C7]" },
  { code: "OBRAS", name: "Obras e Serviços", description: "Infraestrutura e urbana", href: "/obras", icon: HardHat, color: "text-[#B45309]", bg: "bg-[#FEF3C7]", solid: "bg-[#B45309]" },
  { code: "FROTAS", name: "Frotas", description: "Veículos, máquinas e manutenção", href: "/frotas", icon: Truck, color: "text-[#0F766E]", bg: "bg-[#CCFBF1]", solid: "bg-[#0F766E]" },
  { code: "CULTURA", name: "Cultura e Lazer", description: "Cultura e esporte", href: "/cultura", icon: Palette, color: "text-[#E11D48]", bg: "bg-[#FFE4E6]", solid: "bg-[#E11D48]" },
  { code: "CAMARA", name: "Câmara Municipal", description: "Gestão Legislativa", href: "/camara", icon: Landmark, color: "text-[#9333EA]", bg: "bg-[#F3E8FF]", solid: "bg-[#9333EA]" },
  { code: "SEGURANCA", name: "Segurança e Mobilidade", description: "Guarda e trânsito", href: "/seguranca", icon: Shield, color: "text-[#0F766E]", bg: "bg-[#CCFBF1]", solid: "bg-[#0F766E]" },
  { code: "CONFIGURACOES", name: "Configurações e Integrações", description: "Gestão do sistema", href: "/configuracoes", icon: Settings, color: "text-[#475569]", bg: "bg-[#E2E8F0]", solid: "bg-[#475569]" },
];

export default async function PainelPage() {
  const context = await getOptionalTenantContext();
  const moduleActivationByCode = new Map<string, boolean>();

  try {
    const modulos = await context?.prisma.configuracaoModulo.findMany({
      select: { codigo: true, ativo: true },
    }) ?? [];
    modulos.forEach((module) => moduleActivationByCode.set(module.codigo.toUpperCase(), module.ativo));
  } catch (err) {
    console.warn("Notice: Failed to fetch configuracaoModulo status", err);
  }

  const visibleMenuItems = menuItems
    .filter((item) => !hiddenDashboardModuleCodes.has(item.code))
    .filter((item) => context && canShowDashboardCard(context.user, item.accessCode ?? item.code))
    .sort((left, right) => {
      if (left.code === "ADMINISTRACAO") return -1;
      if (right.code === "ADMINISTRACAO") return 1;
      if (left.code === "CONFIGURACOES") return 1;
      if (right.code === "CONFIGURACOES") return -1;
      return left.name.localeCompare(right.name, "pt-BR");
    });

  return (
    <PageFrame className="flex flex-col gap-2 px-1 py-1 md:px-2">
      <PageHeader title="Módulos do sistema" />
      <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
        {visibleMenuItems.map((item) => {
          const accessCode = item.accessCode ?? item.code;
          const isConfig = item.code === "CONFIGURACOES";
          const isProfileBlocked = !context || isModuleBlockedForUser(context.user, accessCode) || !canViewModule(context.user, accessCode);
          const isLocked = isProfileBlocked || (!isConfig && moduleActivationByCode.get(accessCode) === false && !canUseInactiveModule(context.user));

          if (isLocked) {
            return (
              <div
                key={item.name}
                title={isProfileBlocked ? "Acesso bloqueado ou sem permissão de visualização neste perfil." : "Módulo não contratado nesta instância municipal. Ative em Configurações e Integrações > Módulos."}
                className="relative flex h-full min-h-[126px] cursor-not-allowed flex-col justify-center overflow-hidden rounded-md border border-dashed border-slate-300 bg-slate-100/90 px-2 py-3 text-center opacity-60 grayscale select-none dark:border-slate-800 dark:bg-slate-900/60"
              >
                {/* Top Gray Bar */}
                <div className="absolute top-0 left-0 h-[3px] w-full bg-slate-400/50" />

                {/* Lock Badge */}
                <div className="absolute right-2 top-2 rounded-full bg-slate-200 p-1 text-slate-500 dark:bg-slate-800">
                  <Lock className="w-3.5 h-3.5" />
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-md bg-slate-200 ring-1 ring-inset ring-black/5 dark:bg-slate-800">
                    <item.icon className="size-[19px] text-slate-500" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-[12px] sm:text-[13px] font-bold leading-tight text-slate-600 dark:text-slate-400">
                      {item.name}
                    </h3>
                    <span className="mt-1 inline-block rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                       {isProfileBlocked ? "Acesso Bloqueado" : "Não Contratado"}
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <Link key={item.name} href={item.href} className="group block outline-none">
              <div className="relative flex h-full min-h-[126px] cursor-pointer flex-col justify-center overflow-hidden rounded-md border border-slate-300 bg-white px-2 py-3 text-center shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-600 active:bg-slate-100 dark:bg-slate-950">
                
                {/* Colored Top Bar */}
                <div className={`absolute top-0 left-0 h-[3px] w-full ${item.solid} opacity-85`} />
                
                <div className="flex flex-col items-center gap-2">
                  <div className={`flex size-10 items-center justify-center rounded-md ${item.bg} ring-1 ring-inset ring-black/5 transition-transform duration-200 group-hover:scale-105`}>
                    <item.icon className={`size-[19px] ${item.color}`} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-[12px] font-bold leading-tight text-slate-800 transition-colors group-hover:text-primary sm:text-[13px]">
                      {item.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 px-1 text-[10px] font-medium leading-tight text-slate-500">
                      {item.description}
                    </p>
                  </div>
                  <span className="flex items-center justify-center gap-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 group-hover:text-emerald-700">
                    Acessar <ArrowUpRight className="size-3" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </PageFrame>
  );
}
