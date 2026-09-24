"use server";

import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { getIdTokenPrincipal } from "@/lib/platform/session";
import { registerInternalDocumentSignature } from "@/lib/signatures/internal-signature";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function signDocumentInternally(id: string, reauthenticationToken: string): Promise<{ error: string | null }> {
  try {
    if (!reauthenticationToken) throw new Error("Confirme sua senha para assinar o documento.");
    const context = await getTenantContextForModuleOperation("DOCUMENTOS", "create");
    const reauthenticatedUser = await getIdTokenPrincipal(reauthenticationToken);
    if (!reauthenticatedUser) throw new Error("Nao foi possivel validar a confirmacao de senha.");
    if (reauthenticatedUser.firebaseUid !== context.user.firebaseUid) {
      throw new Error("A reautenticacao nao corresponde ao usuario da sessao atual.");
    }
    if (Date.now() - reauthenticatedUser.authTime * 1000 > 5 * 60 * 1000) {
      throw new Error("A confirmacao de senha expirou. Informe sua senha novamente.");
    }
    const requestHeaders = await headers();
    await registerInternalDocumentSignature(context, id, {
      ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      userAgent: requestHeaders.get("user-agent"),
    }, new Date());

    revalidatePath("/documentos");
    revalidatePath("/documentos/assinaturas");
    revalidatePath("/documentos/ged");
    revalidatePath("/documentos/ged?view=recentes");
    revalidatePath("/protocolos/assinaturas");
    revalidatePath("/protocolos/processos");
    return { error: null };
  } catch (error) {
    console.error(error);
    return { error: error instanceof Error ? error.message : "Nao foi possivel registrar a assinatura interna." };
  }
}
