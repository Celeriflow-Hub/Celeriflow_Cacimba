import { EventForm } from "../../EventForm";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { notFound } from "next/navigation";

export default async function EditarEventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { prisma } = await getTenantContextForModule("RH");
  const { id } = await params;
  const event = await prisma.payrollEvent.findUnique({
    where: { id }
  });

  if (!event) {
    notFound();
  }

  return (
    <EventForm data={event} />
  );
}
