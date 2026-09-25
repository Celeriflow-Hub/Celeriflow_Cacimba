CREATE OR REPLACE FUNCTION prevent_financial_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'FinancialAuditLog e append-only e nao pode ser alterado ou excluido';
END;
$$;

DROP TRIGGER IF EXISTS "FinancialAuditLog_append_only" ON "FinancialAuditLog";
CREATE TRIGGER "FinancialAuditLog_append_only"
BEFORE UPDATE OR DELETE ON "FinancialAuditLog"
FOR EACH ROW EXECUTE FUNCTION prevent_financial_audit_log_mutation();

CREATE OR REPLACE FUNCTION prevent_audit_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'AuditEvent e append-only e nao pode ser alterado ou excluido';
END;
$$;

DROP TRIGGER IF EXISTS "AuditEvent_append_only" ON "AuditEvent";
CREATE TRIGGER "AuditEvent_append_only"
BEFORE UPDATE OR DELETE ON "AuditEvent"
FOR EACH ROW EXECUTE FUNCTION prevent_audit_event_mutation();

INSERT INTO "ConfiguracaoPerfil" (
  "id", "codigo", "nome", "descricao", "permissoes", "ativo", "createdAt", "updatedAt"
)
VALUES (
  'bootstrap-test-profile',
  'BOOTSTRAP_TEST',
  'Bootstrap Test Profile',
  'Perfil tecnico exclusivo para validacao da auditoria.',
  '{}',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE SET
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Usuario" (
  "id", "nome", "email", "senha", "ativo", "perfilId", "createdAt", "updatedAt"
)
VALUES (
  'bootstrap-audit-actor',
  'Bootstrap Audit Actor',
  'bootstrap-audit-actor@example.test',
  'bootstrap-only-no-login',
  true,
  'bootstrap-test-profile',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE SET
  "updatedAt" = CURRENT_TIMESTAMP;
