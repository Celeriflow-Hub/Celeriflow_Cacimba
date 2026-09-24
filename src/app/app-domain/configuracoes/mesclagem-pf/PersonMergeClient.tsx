"use client";

import { useState } from "react";
import { approveAndExecutePfDuplicateMerge, proposePfDuplicateMerge, reviewPersonMergeCandidates, reversePfDuplicateMerge } from "./actions";

type PersonOption = { id: string; fullName: string; cpf: string };
type MergeRequest = { id: string; status: string; sourceName: string; targetName: string; proposedBy: string };
type Candidate = { personId: string; score: number; reasons: string[] };

export function PersonMergeClient({ people, requests }: { people: PersonOption[]; requests: MergeRequest[] }) {
  const [sourcePersonId, setSourcePersonId] = useState("");
  const [targetPersonId, setTargetPersonId] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [message, setMessage] = useState("");

  async function reviewCandidates() {
    setMessage("");
    const result = await reviewPersonMergeCandidates(sourcePersonId);
    if ("error" in result) return setMessage(result.error);
    setCandidates(result.candidates);
  }

  async function propose() {
    setMessage("");
    const result = await proposePfDuplicateMerge(sourcePersonId, targetPersonId);
    setMessage("error" in result ? result.error : "Proposta registrada para revisão por outro administrador.");
  }

  async function execute(requestId: string) {
    const result = await approveAndExecutePfDuplicateMerge(requestId);
    setMessage("error" in result ? result.error : "Mesclagem executada.");
  }

  async function reverse(requestId: string) {
    const result = await reversePfDuplicateMerge(requestId);
    setMessage("error" in result ? result.error : "Mesclagem revertida.");
  }

  const personName = (id: string) => people.find((person) => person.id === id)?.fullName ?? id;

  return <div className="space-y-6">
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h2 className="font-semibold text-slate-900">Propor mesclagem PF</h2>
      <p className="mt-1 text-sm text-slate-500">Candidatos são somente para revisão. A origem precisa estar sem vínculos bloqueadores.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">Origem<select value={sourcePersonId} onChange={(event) => { setSourcePersonId(event.target.value); setCandidates([]); }} className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"><option value="">Selecione</option>{people.map((person) => <option key={person.id} value={person.id}>{person.fullName} ({person.cpf})</option>)}</select></label>
        <label className="space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">Destino<select value={targetPersonId} onChange={(event) => setTargetPersonId(event.target.value)} className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"><option value="">Selecione</option>{people.filter((person) => person.id !== sourcePersonId).map((person) => <option key={person.id} value={person.id}>{person.fullName} ({person.cpf})</option>)}</select></label>
      </div>
      <div className="mt-4 flex flex-wrap gap-3"><button type="button" disabled={!sourcePersonId} onClick={reviewCandidates} className="rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 disabled:opacity-50">Revisar candidatos</button><button type="button" disabled={!sourcePersonId || !targetPersonId} onClick={propose} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Propor mesclagem</button></div>
      {candidates.length > 0 && <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm"><p className="font-medium">Candidatos revisáveis</p>{candidates.map((candidate) => <button type="button" key={candidate.personId} onClick={() => setTargetPersonId(candidate.personId)} className="mt-2 block text-left text-indigo-700 hover:underline">{personName(candidate.personId)}: {candidate.score} pontos ({candidate.reasons.join(", ")})</button>)}</div>}
      {message && <p className="mt-4 text-sm text-slate-700" role="status">{message}</p>}
    </section>
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"><div className="border-b border-slate-200 p-4 dark:border-slate-700"><h2 className="font-semibold text-slate-900 dark:text-white">Propostas e mesclagens</h2></div><div className="divide-y divide-slate-100 dark:divide-slate-700">{requests.map((request) => <div key={request.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="text-sm"><p className="font-medium text-slate-900 dark:text-white">{request.sourceName} para {request.targetName}</p><p className="text-slate-500 dark:text-slate-400">{request.status} · proposta por {request.proposedBy}</p></div>{request.status === "PROPOSED" && <button type="button" onClick={() => execute(request.id)} className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Aprovar e executar</button>}{request.status === "EXECUTED" && <button type="button" onClick={() => reverse(request.id)} className="rounded-md border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-800 dark:text-amber-300">Reverter sem alterações posteriores</button>}</div>)}{requests.length === 0 && <p className="p-5 text-sm text-slate-500 dark:text-slate-400">Nenhuma proposta registrada.</p>}</div></section>
  </div>;
}
