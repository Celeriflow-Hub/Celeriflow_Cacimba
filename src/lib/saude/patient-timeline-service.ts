import type { Prisma } from "@prisma/client";

export type TimelineEvent = {
  id: string;
  date: Date;
  kind: string;
  title: string;
  detail: string | null;
  href: string | null;
};

type Reader = Pick<Prisma.TransactionClient,
  | "healthAppointment" | "healthTriage" | "medicalRecord" | "healthDiagnosis"
  | "healthPrescription" | "medicineDispensation" | "vaccinationRecord"
  | "healthExamRequest" | "healthLabOrder" | "healthLabReport" | "healthReferral"
  | "healthRegulationRequest" | "healthTfdRequest" | "healthHomeVisitParticipant"
  | "specializedTherapeuticPlan" | "healthSusReference">;

// Visão cronológica unificada do paciente. Cada evento preserva seu tipo
// original (não converte tudo em "consulta") e aponta para a origem.
export async function listPatientTimeline(db: Reader, patientId: string, limit = 200): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = [];
  const [appointments, records, dispensations, vaccinations, examRequests, labOrders, reports, referrals, regulations, tfdRequests, visitParts, plans] = await Promise.all([
    db.healthAppointment.findMany({ where: { patientId }, orderBy: { date: "desc" }, take: 100, select: { id: true, date: true, status: true, specialty: true, unit: { select: { name: true } } } }),
    db.medicalRecord.findMany({ where: { patientId }, orderBy: { date: "desc" }, take: 100, select: { id: true, date: true, type: true, outcome: true, unit: { select: { name: true } }, diagnoses: { select: { cidReference: { select: { code: true } } } }, prescriptions: { select: { id: true } } } }),
    db.medicineDispensation.findMany({ where: { patientId }, orderBy: { date: "desc" }, take: 100, select: { id: true, date: true, quantity: true, medicine: { select: { name: true } }, unit: { select: { name: true } } } }),
    db.vaccinationRecord.findMany({ where: { patientId }, orderBy: { date: "desc" }, take: 100, select: { id: true, date: true, doseNumber: true, vaccine: { select: { name: true } }, unit: { select: { name: true } } } }),
    db.healthExamRequest.findMany({ where: { patientId }, orderBy: { date: "desc" }, take: 100, select: { id: true, date: true, examName: true, status: true } }),
    db.healthLabOrder.findMany({ where: { patientId }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, createdAt: true, status: true, examRequest: { select: { examName: true } }, examModel: { select: { name: true } } } }),
    db.healthLabReport.findMany({ where: { order: { patientId } }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, createdAt: true, status: true, publishedAt: true, document: { select: { title: true } }, orderId: true } }),
    db.healthReferral.findMany({ where: { patientId }, orderBy: { date: "desc" }, take: 100, select: { id: true, date: true, specialty: true, status: true } }),
    db.healthRegulationRequest.findMany({ where: { patientId }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, createdAt: true, status: true, guideNumber: true, specialty: { select: { name: true } }, service: { select: { name: true } } } }),
    db.healthTfdRequest.findMany({ where: { patientId }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, createdAt: true, destination: true, status: true } }),
    db.healthHomeVisitParticipant.findMany({ where: { patientId }, orderBy: { visit: { visitedAt: "desc" } }, take: 100, select: { visit: { select: { id: true, visitedAt: true, actions: true } } } }),
    db.specializedTherapeuticPlan.findMany({ where: { patientId }, orderBy: { startedAt: "desc" }, take: 50, select: { id: true, startedAt: true, status: true, team: { select: { name: true } } } }),
  ]);
  for (const a of appointments) events.push({ id: `agendamento:${a.id}`, date: a.date, kind: "AGENDAMENTO", title: `Agendamento${a.specialty ? ` · ${a.specialty}` : ""} · ${a.status}`, detail: a.unit?.name || null, href: "/saude/agenda" });
  // Acolhimento/triagem vinculado ao agendamento
  const triages = appointments.length ? await db.healthTriage.findMany({ where: { appointmentId: { in: appointments.map(a => a.id) } }, select: { appointmentId: true, chiefComplaint: true, riskClassification: true, createdAt: true } }) : [];
  for (const t of triages) events.push({ id: `acolhimento:${t.appointmentId}`, date: t.createdAt, kind: "ACOLHIMENTO", title: `Acolhimento · ${t.riskClassification || "sem classificação"}`, detail: t.chiefComplaint?.slice(0, 120) || null, href: "/saude/acolhimento" });
  for (const r of records) {
    events.push({ id: `atendimento:${r.id}`, date: r.date, kind: "ATENDIMENTO", title: `${r.type} · ${r.unit?.name || ""}`.trim(), detail: r.outcome || null, href: `/saude/atendimentos/${r.id}` });
    for (const d of r.diagnoses) events.push({ id: `diagnostico:${r.id}:${d.cidReference.code}`, date: r.date, kind: "DIAGNOSTICO", title: `CID ${d.cidReference.code}`, detail: null, href: `/saude/atendimentos/${r.id}` });
    for (const p of r.prescriptions) events.push({ id: `receita:${p.id}`, date: r.date, kind: "PRESCRICAO", title: "Receita emitida", detail: null, href: `/saude/atendimentos/${r.id}` });
  }
  for (const d of dispensations) events.push({ id: `dispensacao:${d.id}`, date: d.date, kind: "DISPENSACAO", title: `${d.medicine.name} · ${d.quantity}`, detail: d.unit?.name || null, href: "/saude/farmacia" });
  for (const v of vaccinations) events.push({ id: `vacina:${v.id}`, date: v.date, kind: "VACINA", title: `${v.vaccine.name} · dose ${v.doseNumber}`, detail: v.unit?.name || null, href: "/saude/vacinacao" });
  for (const e of examRequests) events.push({ id: `exame:${e.id}`, date: e.date, kind: "EXAME", title: `${e.examName} · ${e.status}`, detail: null, href: "/saude/laboratorio" });
  for (const o of labOrders) events.push({ id: `coleta:${o.id}`, date: o.createdAt, kind: "COLETA", title: `${o.examRequest?.examName || o.examModel?.name || "Exame"} · ${o.status}`, detail: null, href: "/saude/laboratorio" });
  for (const l of reports) events.push({ id: `laudo:${l.id}`, date: l.createdAt, kind: "LAUDO", title: `${l.document.title} · ${l.publishedAt ? "liberado" : l.status}`, detail: null, href: "/saude/laboratorio" });
  for (const r of referrals) events.push({ id: `encaminhamento:${r.id}`, date: r.date, kind: "ENCAMINHAMENTO", title: `${r.specialty} · ${r.status}`, detail: null, href: "/saude/regulacao" });
  for (const r of regulations) events.push({ id: `regulacao:${r.id}`, date: r.createdAt, kind: "REGULACAO", title: `${r.specialty?.name || r.service?.name || "Solicitação"} · ${r.status}${r.guideNumber ? ` · guia ${r.guideNumber}` : ""}`, detail: null, href: "/saude/regulacao" });
  for (const t of tfdRequests) events.push({ id: `tfd:${t.id}`, date: t.createdAt, kind: "TFD", title: `TFD → ${t.destination} · ${t.status}`, detail: null, href: "/saude/tfd" });
  for (const v of visitParts) events.push({ id: `visita:${v.visit.id}`, date: v.visit.visitedAt, kind: "VISITA", title: "Visita domiciliar", detail: v.visit.actions.slice(0, 120), href: "/saude/territorio" });
  for (const p of plans) events.push({ id: `plano:${p.id}`, date: p.startedAt, kind: "CENTRO_ESPECIALIZADO", title: `Plano terapêutico · ${p.team.name} · ${p.status}`, detail: null, href: "/saude/centro-especializado" });
  return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
}
