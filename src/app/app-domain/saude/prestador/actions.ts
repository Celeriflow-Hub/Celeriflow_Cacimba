"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { providerExecuteGuide, resolveProviderSupplier } from "@/lib/saude/provider-service";

const text = (data: FormData, name: string) => String(data.get(name) || "").trim();

async function ownSupplier() {
  const context = await getTenantContextForModuleOperation("SAUDE", "update");
  try {
    const supplier = await resolveProviderSupplier(context);
    return { context, supplier };
  } catch {
    redirect("/saude");
  }
}

export async function executeGuideAction(data: FormData): Promise<void> {
  const { context, supplier } = await ownSupplier();
  await providerExecuteGuide(context, supplier.id, { requestId: text(data, "requestId"), notes: text(data, "notes") || null });
  revalidatePath("/saude/prestador");
}
