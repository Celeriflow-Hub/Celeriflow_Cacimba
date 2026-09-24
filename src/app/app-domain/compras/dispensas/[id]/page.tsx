import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Gavel } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default async function DispensaDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const { prisma } = await getTenantContextForModule("COMPRAS");
  const resolvedParams = await params;
  const dispensa = await prisma.directContracting.findUnique({
    where: { id: resolvedParams.id },
    include: {
      process: true,
      supplier: { include: { company: true } }
    }
  });

  if (!dispensa) {
    notFound();
  }

  return (
    <PageFrame className="space-y-2">
      <PageHeader title="Detalhes da Dispensa" icon={<Gavel className="size-4 shrink-0 text-amber-600" />} action={<><Link href="/compras/licitacoes" aria-label="Voltar"><Button variant="outline" size="icon"><ArrowLeft className="size-4" /></Button></Link><Link href={`/compras/dispensas/${dispensa.id}/editar`}><Button size="sm"><Edit className="size-3.5" /><span className="hidden sm:inline">Editar</span></Button></Link></>} />

      <div className="grid gap-2 md:grid-cols-2">
        <Card className="rounded-md">
          <CardHeader className="border-b p-3">
            <CardTitle className="text-sm">Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-3 text-sm">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo</p>
              <p className="text-lg">{dispensa.type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge>{dispensa.status}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Processo Vinculado</p>
              <p>{dispensa.process?.number || "Nenhum"}</p>
              <p className="text-sm text-muted-foreground">{dispensa.process?.object}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader className="border-b p-3">
            <CardTitle className="text-sm">Fornecedor e Justificativa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-3 text-sm">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fornecedor</p>
              <p>{dispensa.supplier ? (dispensa.supplier.company?.corporateName || dispensa.supplier.company?.tradeName) : "A Definir"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Justificativa Legal</p>
              <p className="text-sm whitespace-pre-wrap">{dispensa.justification || "Não informada"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}
