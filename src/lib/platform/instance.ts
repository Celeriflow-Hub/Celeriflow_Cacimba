const INSTANCE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/;

export function getCeleriFlowInstanceId() {
  const instanceId = process.env.CELERIFLOW_INSTANCE_ID;
  if (!instanceId || !INSTANCE_ID_PATTERN.test(instanceId)) {
    throw new Error(
      "CELERIFLOW_INSTANCE_ID deve conter apenas letras minusculas, numeros e hifens.",
    );
  }
  return instanceId;
}
