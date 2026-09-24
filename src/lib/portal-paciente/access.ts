import { getTenantContextForModule, type AppContext } from "@/lib/platform/tenant-context";

export type PatientPortalAccess =
  | { status: "AVAILABLE"; context: AppContext; patient: { id: string; personId: string; fullName: string } }
  | { status: "UNAVAILABLE"; reason: string };

/**
 * Resolve a identidade do paciente exclusivamente a partir da sessão.
 * Caminho primário: Patient.usuarioId. Alternativo: cadeia
 * Usuario -> Employee -> Person -> Patient (servidores que são pacientes).
 * Nenhum identificador de paciente vindo do navegador é aceito aqui.
 */
export async function getPatientPortalAccess(): Promise<PatientPortalAccess> {
  const context = await getTenantContextForModule("PORTAL_PACIENTE");
  const direct = await context.prisma.patient.findUnique({
    where: { usuarioId: context.user.id },
    select: { id: true, status: true, personId: true, person: { select: { fullName: true } } },
  });
  if (direct && direct.status === "Ativo") {
    return { status: "AVAILABLE", context, patient: { id: direct.id, personId: direct.personId, fullName: direct.person.fullName } };
  }
  if (context.user.employeeId) {
    const viaEmployee = await context.prisma.patient.findFirst({
      where: { status: "Ativo", person: { employee: { id: context.user.employeeId } } },
      select: { id: true, personId: true, person: { select: { fullName: true } } },
    });
    if (viaEmployee) {
      return { status: "AVAILABLE", context, patient: { id: viaEmployee.id, personId: viaEmployee.personId, fullName: viaEmployee.person.fullName } };
    }
  }
  return { status: "UNAVAILABLE", reason: "Nenhum cadastro de paciente vinculado a este acesso. Procure a unidade de saúde para vincular." };
}
