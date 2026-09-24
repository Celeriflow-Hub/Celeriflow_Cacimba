import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, ShieldCheck, ArrowRight, Building2 } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-all">
      <div className="container flex h-16 items-center justify-between mx-auto px-4 md:px-6">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <Image 
            src="/favicon.png" 
            alt="CeleriFlow ERP Governamental" 
            width={180} 
            height={55} 
            className="h-10 sm:h-11 w-auto object-contain group-hover:scale-105 transition-transform" 
            priority 
          />
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 hidden sm:inline-block">
            ERP Gov
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-8 items-center text-sm font-medium">
          <Link href="#modulos" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
            Módulos (24+)
          </Link>
          <Link href="#demonstracao" className="text-muted-foreground hover:text-foreground transition-colors">
            Painel Executivo
          </Link>
          <Link href="#regulatório" className="text-muted-foreground hover:text-foreground transition-colors">
            Conformidade & IA
          </Link>
          <Link href="#calculadora" className="text-muted-foreground hover:text-foreground transition-colors">
            Impacto & ROI
          </Link>
          <Link href="#seguranca" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Segurança
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link 
            href="/app-domain" 
            className={buttonVariants({ variant: "outline", size: "sm", className: "h-9 border-primary/30 hover:border-primary/60 font-semibold" })}
          >
            Acessar Sistema
          </Link>
          <Link 
            href="#contato" 
            className={buttonVariants({ size: "sm", className: "h-9 bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-md shadow-primary/20 font-semibold" })}
          >
            Agendar Demo
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2">
          <Link 
            href="/app-domain" 
            className={buttonVariants({ variant: "outline", size: "sm", className: "text-xs h-8 px-2.5" })}
          >
            Entrar
          </Link>
          <Sheet>
            <SheetTrigger className={buttonVariants({ variant: "ghost", size: "icon", className: "h-9 w-9" })} aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <SheetTitle className="text-left font-bold text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                CeleriFlow ERP
              </SheetTitle>
              <div className="flex flex-col gap-3 mt-6">
                <Link href="#modulos" className="text-sm font-medium p-2.5 hover:bg-muted rounded-lg transition-colors">
                  Módulos e Recursos (24+)
                </Link>
                <Link href="#demonstracao" className="text-sm font-medium p-2.5 hover:bg-muted rounded-lg transition-colors">
                  Painel Executivo 360°
                </Link>
                <Link href="#regulatorio" className="text-sm font-medium p-2.5 hover:bg-muted rounded-lg transition-colors">
                  SIAFIC, PNCP & Pix
                </Link>
                <Link href="#calculadora" className="text-sm font-medium p-2.5 hover:bg-muted rounded-lg transition-colors">
                  Calculadora de ROI Municipal
                </Link>
                <Link href="#seguranca" className="text-sm font-medium p-2.5 hover:bg-muted rounded-lg transition-colors">
                  Segurança & LGPD
                </Link>
                <div className="pt-4 border-t flex flex-col gap-2">
                  <Link href="/app-domain" className={buttonVariants({ variant: "outline", className: "w-full justify-center" })}>
                    Acessar Plataforma
                  </Link>
                  <Link href="#contato" className={buttonVariants({ className: "w-full justify-center bg-primary" })}>
                    Solicitar Demonstração
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  );
}
