"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Accessibility,
  Activity,
  AlertTriangle,
  Archive,
  ArrowLeft,
  ArrowRightLeft,
  BadgeCheck,
  BarChart3,
  Banknote,
  Bell,
  BookOpen,
  BookOpenCheck,
  Boxes,
  Briefcase,
  Building2,
  Bus,
  Calculator,
  Cable,
  Calendar,
  CalendarClock,
  CalendarDays,
  Camera,
  CarFront,
  ChartNoAxesCombined,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Cross,
  DatabaseZap,
  Download,
  Droplet,
  Droplets,
  Factory,
  FileBadge,
  FileBox,
  FileCheck,
  FileCheck2,
  FileHeart,
  FileOutput,
  FileSearch,
  FileSignature,
  FileText,
  FlaskConical,
  Folder,
  FolderOpen,
  Fuel,
  Gavel,
  Gift,
  GitCompare,
  Globe,
  GraduationCap,
  HandCoins,
  Handshake,
  HardHat,
  Headphones,
  Heart,
  HeartHandshake,
  HeartPulse,
  History,
  Home,
  ImageIcon,
  Landmark,
  LayoutDashboard,
  Leaf,
  Layers,
  Lightbulb,
  ListTodo,
  MailOpen,
  Map,
  MapPin,
  MapPinned,
  Megaphone,
  Menu,
  MessageSquareWarning,
  Mic,
  Network,
  Newspaper,
  Package,
  Palette,
  Pickaxe,
  Pill,
  Plus,
  PlugZap,
  Receipt,
  ReceiptText,
  Route,
  Ruler,
  Scale,
  School,
  Search,
  Send,
  Server,
  Settings,
  Settings2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  Sprout,
  Stethoscope,
  Syringe,
  TrendingUp,
  Trash2,
  Tractor,
  Truck,
  Trophy,
  UserRound,
  Users,
  Utensils,
  WalletCards,
  Warehouse,
  Workflow,
  Wrench,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconRegistry = {
  accessibility: Accessibility,
  activity: Activity,
  alertTriangle: AlertTriangle,
  archive: Archive,
  arrowLeft: ArrowLeft,
  arrowRightLeft: ArrowRightLeft,
  badgeCheck: BadgeCheck,
  barChart3: BarChart3,
  banknote: Banknote,
  bell: Bell,
  bookOpen: BookOpen,
  bookOpenCheck: BookOpenCheck,
  boxes: Boxes,
  briefcase: Briefcase,
  building2: Building2,
  bus: Bus,
  calculator: Calculator,
  cable: Cable,
  calendar: Calendar,
  calendarClock: CalendarClock,
  calendarDays: CalendarDays,
  camera: Camera,
  carFront: CarFront,
  chartNoAxesCombined: ChartNoAxesCombined,
  clipboardCheck: ClipboardCheck,
  clipboardList: ClipboardList,
  clock3: Clock3,
  cross: Cross,
  databaseZap: DatabaseZap,
  download: Download,
  droplet: Droplet,
  droplets: Droplets,
  factory: Factory,
  fileBadge: FileBadge,
  fileBox: FileBox,
  fileCheck: FileCheck,
  fileCheck2: FileCheck2,
  fileHeart: FileHeart,
  fileOutput: FileOutput,
  fileSearch: FileSearch,
  fileSignature: FileSignature,
  fileText: FileText,
  flaskConical: FlaskConical,
  folder: Folder,
  folderOpen: FolderOpen,
  fuel: Fuel,
  gavel: Gavel,
  gift: Gift,
  gitCompare: GitCompare,
  globe: Globe,
  graduationCap: GraduationCap,
  handCoins: HandCoins,
  handshake: Handshake,
  hardHat: HardHat,
  headphones: Headphones,
  heart: Heart,
  heartHandshake: HeartHandshake,
  heartPulse: HeartPulse,
  history: History,
  home: Home,
  imageIcon: ImageIcon,
  landmark: Landmark,
  layers: Layers,
  layoutDashboard: LayoutDashboard,
  leaf: Leaf,
  lightbulb: Lightbulb,
  listTodo: ListTodo,
  mailOpen: MailOpen,
  map: Map,
  mapPin: MapPin,
  mapPinned: MapPinned,
  megaphone: Megaphone,
  menu: Menu,
  messageSquareWarning: MessageSquareWarning,
  mic: Mic,
  network: Network,
  newspaper: Newspaper,
  package: Package,
  palette: Palette,
  pickaxe: Pickaxe,
  pill: Pill,
  plus: Plus,
  plugZap: PlugZap,
  receipt: Receipt,
  receiptText: ReceiptText,
  route: Route,
  ruler: Ruler,
  scale: Scale,
  school: School,
  search: Search,
  send: Send,
  server: Server,
  settings: Settings,
  settings2: Settings2,
  shield: Shield,
  shieldAlert: ShieldAlert,
  shieldCheck: ShieldCheck,
  siren: Siren,
  sparkles: Sparkles,
  sprout: Sprout,
  stethoscope: Stethoscope,
  syringe: Syringe,
  trendingUp: TrendingUp,
  trash2: Trash2,
  tractor: Tractor,
  truck: Truck,
  trophy: Trophy,
  userRound: UserRound,
  users: Users,
  utensils: Utensils,
  walletCards: WalletCards,
  warehouse: Warehouse,
  workflow: Workflow,
  wrench: Wrench,
  x: X,
} as const;

export type ModuleIconName = keyof typeof iconRegistry;

export type ModuleNavItem = {
  title: string;
  href: string;
  icon: ModuleIconName;
  exact?: boolean;
  query?: { key: string; values: string[] };
};

export type ModuleNavGroup = {
  title: string;
  items: ModuleNavItem[];
};

type ModuleShellProps = {
  moduleTitle: string;
  moduleCaption?: string;
  moduleIcon: ModuleIconName;
  navigation: ModuleNavGroup[];
  children: ReactNode;
  sidebarVariant?: "dark" | "light";
  desktopCollapsible?: boolean;
};

function isCurrentRoute(
  item: ModuleNavItem,
  pathname: string,
  searchParams: ReturnType<typeof useSearchParams>,
) {
  const itemPath = item.href.split("?")[0];
  const matchesPath = item.exact
    ? pathname === itemPath
    : pathname === itemPath || pathname.startsWith(itemPath + "/");

  if (!matchesPath) return false;
  if (!item.query) return true;

  return item.query.values.includes(searchParams.get(item.query.key) || "");
}

export function ModuleShell({
  moduleTitle,
  moduleCaption,
  moduleIcon,
  navigation,
  children,
  sidebarVariant = "dark",
  desktopCollapsible = true,
}: ModuleShellProps) {
  const ModuleIcon = iconRegistry[moduleIcon];
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMenuCollapsed, setIsDesktopMenuCollapsed] = useState(false);
  const isLightSidebar = sidebarVariant === "light";
  const isCollapsed = desktopCollapsible && isDesktopMenuCollapsed;

  return (
    <div
      data-module-shell
      className="relative -my-2 flex h-full min-h-0 w-[calc(100%+1rem)] max-w-[calc(1600px+1rem)] flex-1 flex-col overflow-hidden bg-slate-100 sm:-my-3 sm:w-[calc(100%+1.5rem)] sm:max-w-[calc(1600px+1.5rem)] lg:flex-row"
    >
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-slate-300 bg-white px-3 lg:hidden">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-700">Módulo operacional</p>
          <h2 className="truncate text-sm font-bold leading-tight text-slate-800">{moduleTitle}</h2>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label={"Abrir menu de " + moduleTitle}
          aria-expanded={isMobileMenuOpen}
          className="flex size-8 items-center justify-center rounded border border-slate-300 text-slate-700 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          <Menu className="size-4" />
        </button>
      </header>

      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label={"Fechar menu de " + moduleTitle}
          className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(19.5rem,calc(100vw-2rem))] -translate-x-full flex-col border-r px-3 py-4 shadow-2xl transition-[transform,width,padding] duration-200 lg:sticky lg:top-0 lg:z-20 lg:flex lg:h-full lg:translate-x-0 lg:shadow-none",
          desktopCollapsible ? "lg:w-52" : "lg:w-52",
          isLightSidebar
            ? "border-slate-300 bg-slate-100 text-slate-800"
            : "border-slate-700 bg-slate-950 text-slate-100",
          isCollapsed && "lg:w-14 lg:px-2",
          isMobileMenuOpen && "translate-x-0",
        )}
      >
        <div className={cn("mb-2 flex shrink-0 items-start justify-between border-b px-2 pb-2", isLightSidebar ? "border-slate-300" : "border-slate-700", isCollapsed && "lg:justify-center lg:px-0")}>
          <div className={cn("min-w-0", isCollapsed && "lg:hidden")}>
            <div className="mb-2 flex size-8 items-center justify-center rounded bg-emerald-600 text-white">
              <ModuleIcon className="size-4" />
            </div>
            <h2 className={cn("text-[13px] font-bold leading-tight", isLightSidebar ? "text-slate-800" : "truncate uppercase tracking-wide text-white")}>
              {moduleTitle}
            </h2>
            {moduleCaption && (
              <p className={cn("mt-0.5 text-[9px] font-medium uppercase tracking-[0.14em]", isLightSidebar ? "text-slate-500" : "text-slate-400")}>
                {moduleCaption}
              </p>
            )}
          </div>
          {desktopCollapsible && (
            <button
              type="button"
              onClick={() => setIsDesktopMenuCollapsed((value) => !value)}
              aria-label={isCollapsed ? `Expandir menu de ${moduleTitle}` : `Recolher menu de ${moduleTitle}`}
              aria-expanded={!isCollapsed}
              className={cn(
                "hidden size-7 items-center justify-center rounded outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 lg:flex",
                isLightSidebar ? "text-slate-600 hover:bg-white hover:text-slate-900" : "text-slate-400 hover:bg-slate-800 hover:text-white",
              )}
            >
              <Menu className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label={"Fechar menu de " + moduleTitle}
            className={cn(
              "flex size-7 items-center justify-center rounded lg:hidden",
              isLightSidebar ? "text-slate-500 hover:bg-white hover:text-slate-900" : "text-slate-400 hover:bg-slate-800 hover:text-white",
            )}
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden pr-1" aria-label={"Navegação de " + moduleTitle}>
          {navigation.map((group) => (
            <section key={group.title} className={cn("border-b pb-1.5 last:border-0", isLightSidebar ? "border-slate-200" : "border-slate-800")}>
              <p className={cn("px-2 pb-0.5 text-[9px] font-bold uppercase tracking-[0.14em]", isLightSidebar ? "text-slate-500" : "text-slate-500", isCollapsed && "lg:sr-only")}>{group.title}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const current = isCurrentRoute(item, pathname, searchParams);
                  const Icon = iconRegistry[item.icon];
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.title : undefined}
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "flex min-h-7 items-center gap-2.5 rounded-md px-2.5 py-1 text-[11px] font-medium outline-none transition-colors",
                        isCollapsed && "lg:justify-center lg:px-1",
                        current
                          ? "bg-emerald-700 text-white"
                          : isLightSidebar
                            ? "text-slate-600 hover:bg-white hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-emerald-600"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-400",
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0", current ? "text-white" : isLightSidebar ? "text-slate-500" : "text-slate-400")} strokeWidth={current ? 2.5 : 2} />
                      <span className={cn("min-w-0 truncate", isCollapsed && "lg:hidden")}>{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        <div className={cn("mt-2 shrink-0 border-t pt-2", isLightSidebar ? "border-slate-300" : "border-slate-700")}>
          <Link
            href="/dashboard"
            title={isCollapsed ? "Voltar ao painel geral" : undefined}
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn(
              "flex min-h-7 items-center gap-2.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
              isCollapsed && "lg:justify-center lg:px-1",
              isLightSidebar ? "text-slate-600 hover:bg-white hover:text-slate-900" : "text-slate-300 hover:bg-slate-800 hover:text-white",
            )}
          >
            <ArrowLeft className={cn("size-4 shrink-0", isLightSidebar ? "text-slate-500" : "text-slate-400")} />
            <span className={cn(isCollapsed && "lg:hidden")}>Voltar ao painel geral</span>
          </Link>
        </div>
      </aside>

      <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden bg-slate-100">
        {children}
      </main>
    </div>
  );
}
