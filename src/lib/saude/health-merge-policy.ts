export function normalizeMergeText(value: string | null | undefined) {
  return (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

export function assertPatientMergeCriteria(target: { fullName: string; birthDate: Date | null; motherName: string | null }, source: { fullName: string; birthDate: Date | null; motherName: string | null }) {
  const sameName = normalizeMergeText(target.fullName) === normalizeMergeText(source.fullName);
  const sameBirthDate = Boolean(target.birthDate && source.birthDate && target.birthDate.toISOString().slice(0, 10) === source.birthDate.toISOString().slice(0, 10));
  const sameMother = Boolean(normalizeMergeText(target.motherName) && normalizeMergeText(target.motherName) === normalizeMergeText(source.motherName));
  if (!sameName || !sameBirthDate || !sameMother) throw new Error("Os prontuários devem ter nome, data de nascimento e nome da mãe coincidentes.");
  return { sameName, sameBirthDate, sameMother };
}

export function assertProfessionalMergeCriteria(targetName: string, sourceName: string) {
  if (!normalizeMergeText(targetName) || normalizeMergeText(targetName) !== normalizeMergeText(sourceName)) throw new Error("Os profissionais devem ter o mesmo nome para unificação.");
  return { sameName: true };
}

export function assertAddressMergeCriteria(target: { zipCode: string | null; streetName: string | null }, source: { zipCode: string | null; streetName: string | null }) {
  const targetZip = (target.zipCode || "").replace(/\D/g, "");
  const sourceZip = (source.zipCode || "").replace(/\D/g, "");
  const sameZipCode = Boolean(targetZip && targetZip === sourceZip);
  const sameStreet = Boolean(normalizeMergeText(target.streetName) && normalizeMergeText(target.streetName) === normalizeMergeText(source.streetName));
  if (!sameZipCode || !sameStreet) throw new Error("Os endereços devem ter CEP e logradouro coincidentes.");
  return { sameZipCode, sameStreet };
}
