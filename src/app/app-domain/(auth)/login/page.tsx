"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, ArrowRight, ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { APP_VERSION } from "@/lib/version";
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const returnTo = (() => {
    const candidate = searchParams.get("returnTo");
    return candidate && candidate.startsWith("/") && !candidate.startsWith("//") && !candidate.startsWith("/app-domain")
      ? candidate
      : "/dashboard";
  })();
  
  // Estado para controlar a visualização (Login vs Esqueci a Senha)
  const [view, setView] = useState<"login" | "reset" | "reset-success">("login");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();
      
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setErrorMsg(data.error || "Erro ao validar sessão com o servidor.");
        return;
      }

      router.push(returnTo);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "E-mail ou senha incorretos. Tente novamente.";
      setErrorMsg(`Erro: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    
    try {
      await sendPasswordResetEmail(auth, email);
    } catch {
      // Keep a neutral response so the reset flow does not reveal whether the
      // submitted address belongs to a registered user.
    } finally {
      setView("reset-success");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden relative">
      {/* Elementos decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] mix-blend-screen animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] mix-blend-screen" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-background/70 backdrop-blur-2xl border border-primary/20 shadow-[0_0_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_0_60px_-15px_rgba(255,255,255,0.1)] rounded-3xl p-6 sm:p-8 transition-all duration-300 relative overflow-hidden">
          {/* Subtle top highlight */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <div className="flex flex-col items-center mb-6">
            <Image 
              src="/logo1.png" 
              alt="CeleriFlow" 
              width={180} 
              height={50}
              className="object-contain mx-auto mb-2 drop-shadow-sm"
              priority
            />
            <p className="text-xs sm:text-sm text-muted-foreground text-center font-medium">
              {view === "login" && "Acesse a plataforma de gestão integrada"}
              {view === "reset" && "Redefina sua senha de acesso"}
              {view === "reset-success" && "Pronto!"}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-sm text-center font-medium">
              {errorMsg}
            </div>
          )}

          {view === "login" && (
            <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    E-mail Institucional
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="voce@prefeitura.gov.br"
                      className="pl-9 h-11 bg-muted/50 border-transparent transition-all focus:bg-background focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Senha
                    </Label>
                    <Button 
                      type="button"
                      variant="link" 
                      onClick={() => { setView("reset"); setErrorMsg(""); }}
                      className="px-0 font-normal h-auto text-[11px] text-primary/70 hover:text-primary"
                    >
                      Esqueceu a senha?
                    </Button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-9 pr-9 h-11 bg-muted/50 border-transparent transition-all focus:bg-background focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-primary/20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Entrar no Sistema
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          )}

          {view === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email" className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Seu E-mail
                  </Label>
                  <p className="text-xs text-muted-foreground pb-1">
                    Enviaremos um link para você cadastrar uma nova senha.
                  </p>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="voce@prefeitura.gov.br"
                      className="pl-9 h-11 bg-muted/50 border-transparent transition-all focus:bg-background focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-2.5">
                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-medium shadow-md shadow-primary/20"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar Link de Recuperação"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setView("login"); setErrorMsg(""); }}
                  className="w-full h-11 text-xs text-muted-foreground"
                  disabled={isLoading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </div>
            </form>
          )}

          {view === "reset-success" && (
            <div className="flex flex-col items-center space-y-5 animate-in zoom-in-95 duration-500 py-2">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="font-semibold text-base">E-mail Enviado!</h3>
                <p className="text-xs text-muted-foreground">
                  Se houver uma conta ativa para este endereço, você receberá as instruções de recuperação.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setView("login")}
                className="w-full h-11 text-sm"
              >
                Voltar para o Login
              </Button>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-border/40 flex flex-col items-center justify-center gap-1.5">
            <div className="flex items-center gap-2">
              <p className="text-[9px] text-muted-foreground/60 text-center uppercase tracking-[0.2em] font-medium">
                Developed by
              </p>
              <span className="text-[10px] font-mono text-muted-foreground/60">| {APP_VERSION}</span>
            </div>
            <Image 
              src="/logo_robonuvem.png" 
              alt="Robonuvem" 
              width={50} 
              height={14}
              className="object-contain opacity-50 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
