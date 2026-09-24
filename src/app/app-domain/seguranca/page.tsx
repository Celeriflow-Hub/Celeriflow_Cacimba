import Link from "next/link";
import { AlertTriangle, ArrowRight, BarChart3, Camera, CarFront, Route, Shield, Users, Wrench } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

const quickLinks = [
  { title: "Guarda e Equipes", href: "/seguranca/guardas", icon: Users, text: "Efetivo, agentes de transito e equipes de escala." },
  { title: "Ocorrencias", href: "/seguranca/ocorrencias", icon: AlertTriangle, text: "Registros internos, despacho e acompanhamento." },
  { title: "Rondas e Cameras", href: "/seguranca/rondas", icon: Camera, text: "Roteiros preventivos e pontos de videomonitoramento." },
  { title: "Transito", href: "/seguranca/transito", icon: CarFront, text: "Infracoes, sinalizacao e operacoes viarias." },
  { title: "Mobilidade e Rotas", href: "/seguranca/mobilidade", icon: Route, text: "Transporte, interdicoes, estacionamento e acessibilidade." },
  { title: "OS e Equipamentos", href: "/seguranca/ordens", icon: Wrench, text: "Ordens de servico, viaturas, radios, cones e ativos." },
];

export default async function SegurancaDashboard() {
  const { prisma } = await getTenantContextForModule("SEGURANCA");
  const [guardas, ocorrencias, infracoes, registros, urgentes, recentes] = await Promise.all([
    prisma.segurancaGuarda.count({ where: { isActive: true } }),
    prisma.segurancaOcorrencia.count({ where: { isActive: true } }),
    prisma.segurancaInfracao.count({ where: { isActive: true } }),
    prisma.segurancaMobilidadeRegistro.count({ where: { isActive: true } }),
    prisma.segurancaMobilidadeRegistro.count({ where: { isActive: true, prioridade: { in: ["Alta", "Urgente"] } } }),
    prisma.segurancaMobilidadeRegistro.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return (
    <PageFrame className="space-y-2 px-1 py-1 md:px-2">
      <PageHeader
        title="Seguranca e Mobilidade"
        icon={<Shield className="size-4 shrink-0 text-cyan-700" />}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Card className="rounded-lg border-slate-300 shadow-sm"><CardHeader className="p-4 pb-1"><CardTitle className="text-sm text-slate-500">Efetivo ativo</CardTitle></CardHeader><CardContent className="p-4 pt-1 text-2xl font-bold">{guardas}</CardContent></Card>
        <Card className="rounded-lg border-slate-300 shadow-sm"><CardHeader className="p-4 pb-1"><CardTitle className="text-sm text-slate-500">Ocorrencias ativas</CardTitle></CardHeader><CardContent className="p-4 pt-1 text-2xl font-bold">{ocorrencias}</CardContent></Card>
        <Card className="rounded-lg border-slate-300 shadow-sm"><CardHeader className="p-4 pb-1"><CardTitle className="text-sm text-slate-500">Autos ativos</CardTitle></CardHeader><CardContent className="p-4 pt-1 text-2xl font-bold">{infracoes}</CardContent></Card>
        <Card className="rounded-lg border-slate-300 shadow-sm"><CardHeader className="p-4 pb-1"><CardTitle className="text-sm text-slate-500">Registros operacionais</CardTitle></CardHeader><CardContent className="p-4 pt-1 text-2xl font-bold">{registros}</CardContent></Card>
        <Card className="rounded-lg border-slate-300 shadow-sm"><CardHeader className="p-4 pb-1"><CardTitle className="text-sm text-slate-500">Prioridade alta</CardTitle></CardHeader><CardContent className="p-4 pt-1 text-2xl font-bold text-rose-600">{urgentes}</CardContent></Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map((item) => (
            <Link key={item.href} href={item.href} className="group rounded-lg border border-slate-300 bg-white p-4 shadow-sm transition hover:shadow-md">
              <item.icon className="mb-3 h-6 w-6 text-cyan-700" />
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-slate-900">{item.title}</h2>
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-cyan-700" />
              </div>
              <p className="mt-2 text-sm text-slate-500">{item.text}</p>
            </Link>
          ))}
        </div>

        <Card className="rounded-lg border-slate-300 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4" /> Ultimos registros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-2">
            {recentes.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum registro operacional cadastrado.</p>
            ) : recentes.map((item) => (
              <div key={item.id} className="rounded-md border border-slate-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.codigo} - {item.titulo}</p>
                    <p className="text-xs text-slate-500">{item.categoria} | {item.local || "Sem local"}</p>
                  </div>
                  <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100">{item.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}
