import { Prisma } from "@prisma/client";
import { AccessError } from "@/lib/platform/tenant-context";

export type FleetPageIssue = {
  kind: "database" | "session" | "access";
  title: string;
  message: string;
};

export function fleetPageIssue(error: unknown): FleetPageIssue | null {
  if (error instanceof AccessError) {
    if (error.status === 401) {
      return {
        kind: "session",
        title: "Entre novamente para acessar Frotas",
        message: "Sua sessão expirou ou não pôde ser validada.",
      };
    }
    return { kind: "access", title: "Acesso a Frotas indisponível", message: error.message };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2021", "P2022"].includes(error.code)) {
    return {
      kind: "database",
      title: "Frotas aguarda atualização do banco",
      message: "A estrutura necessária para Frotas ainda não está disponível no banco desta instância. O administrador precisa concluir a atualização do banco para liberar o módulo.",
    };
  }

  return null;
}
