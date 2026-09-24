-- RH e Folha: catálogo municipal versionado e editável.
-- A migration preserva Payroll, PayrollEvent e PayrollItem legados. Os novos
-- registros serão a fonte de parametrização do motor versionado posterior.

CREATE TABLE "HrPayrollRuleSet" (
    "id" TEXT NOT NULL,
    "configuracaoInstanciaId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "scope" TEXT NOT NULL DEFAULT 'DEMONSTRACAO',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "legalReference" TEXT,
    "notes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "approvedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrPayrollRuleSet_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "HrPayrollRuleSet_effectiveRange_check" CHECK ("effectiveUntil" IS NULL OR "effectiveUntil" > "effectiveFrom")
);

CREATE TABLE "HrPayrollRule" (
    "id" TEXT NOT NULL,
    "ruleSetId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "valueType" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "unit" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 100,
    "legalReference" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrPayrollRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HrPayrollRubric" (
    "id" TEXT NOT NULL,
    "ruleSetId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "esocialNatureCode" TEXT,
    "calculationMethod" TEXT NOT NULL DEFAULT 'MANUAL',
    "formulaExpression" TEXT,
    "calculationBaseCode" TEXT,
    "fixedValue" DECIMAL(18,2),
    "percentageRate" DECIMAL(9,6),
    "priority" INTEGER NOT NULL DEFAULT 100,
    "legalReference" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrPayrollRubric_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HrPayrollRubricIncidence" (
    "id" TEXT NOT NULL,
    "rubricId" TEXT NOT NULL,
    "incidenceType" TEXT NOT NULL,
    "isIncluded" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrPayrollRubricIncidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HrSocialSecurityScheme" (
    "id" TEXT NOT NULL,
    "ruleSetId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regime" TEXT NOT NULL,
    "employeeCalculationMethod" TEXT NOT NULL DEFAULT 'PROGRESSIVA',
    "ceilingValue" DECIMAL(18,2),
    "employerContributionRate" DECIMAL(9,6),
    "actuarialContributionRate" DECIMAL(9,6),
    "legalReference" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrSocialSecurityScheme_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HrSocialSecurityBand" (
    "id" TEXT NOT NULL,
    "socialSecuritySchemeId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "lowerLimit" DECIMAL(18,2) NOT NULL,
    "upperLimit" DECIMAL(18,2),
    "employeeRate" DECIMAL(9,6) NOT NULL,
    "employerRate" DECIMAL(9,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrSocialSecurityBand_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "HrSocialSecurityBand_range_check" CHECK ("upperLimit" IS NULL OR "upperLimit" > "lowerLimit"),
    CONSTRAINT "HrSocialSecurityBand_employeeRate_check" CHECK ("employeeRate" >= 0 AND "employeeRate" <= 100),
    CONSTRAINT "HrSocialSecurityBand_employerRate_check" CHECK ("employerRate" IS NULL OR ("employerRate" >= 0 AND "employerRate" <= 100))
);

CREATE TABLE "HrVacationPolicy" (
    "id" TEXT NOT NULL,
    "ruleSetId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "employmentNature" TEXT NOT NULL,
    "acquisitionMonths" INTEGER NOT NULL DEFAULT 12,
    "concessionMonths" INTEGER NOT NULL DEFAULT 12,
    "entitlementDays" INTEGER NOT NULL DEFAULT 30,
    "maxSplits" INTEGER NOT NULL DEFAULT 3,
    "minFirstSplitDays" INTEGER NOT NULL DEFAULT 14,
    "minOtherSplitDays" INTEGER NOT NULL DEFAULT 5,
    "additionalPayRate" DECIMAL(9,6) NOT NULL DEFAULT 33.333333,
    "allowsCashAbono" BOOLEAN NOT NULL DEFAULT false,
    "maxCashAbonoDays" INTEGER NOT NULL DEFAULT 0,
    "allowsAdvanceThirteenth" BOOLEAN NOT NULL DEFAULT false,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "legalReference" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrVacationPolicy_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "HrVacationPolicy_months_check" CHECK ("acquisitionMonths" > 0 AND "concessionMonths" > 0),
    CONSTRAINT "HrVacationPolicy_days_check" CHECK ("entitlementDays" > 0 AND "maxSplits" > 0 AND "minFirstSplitDays" > 0 AND "minOtherSplitDays" > 0),
    CONSTRAINT "HrVacationPolicy_additionalPayRate_check" CHECK ("additionalPayRate" >= 0 AND "additionalPayRate" <= 100),
    CONSTRAINT "HrVacationPolicy_abono_check" CHECK ("maxCashAbonoDays" >= 0)
);

CREATE TABLE "HrCalculationPolicy" (
    "id" TEXT NOT NULL,
    "ruleSetId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "roundingMode" TEXT NOT NULL DEFAULT 'HALF_UP',
    "roundingScale" INTEGER NOT NULL DEFAULT 2,
    "movementCutoffDay" INTEGER NOT NULL DEFAULT 20,
    "paymentDay" INTEGER,
    "negativeNetPayPolicy" TEXT NOT NULL DEFAULT 'BLOQUEAR',
    "maxConsignmentMarginRate" DECIMAL(9,6),
    "remunerationCeiling" DECIMAL(18,2),
    "freezeOnClose" BOOLEAN NOT NULL DEFAULT true,
    "legalReference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrCalculationPolicy_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "HrCalculationPolicy_roundingScale_check" CHECK ("roundingScale" >= 0 AND "roundingScale" <= 6),
    CONSTRAINT "HrCalculationPolicy_cutoffDay_check" CHECK ("movementCutoffDay" >= 1 AND "movementCutoffDay" <= 31),
    CONSTRAINT "HrCalculationPolicy_paymentDay_check" CHECK ("paymentDay" IS NULL OR ("paymentDay" >= 1 AND "paymentDay" <= 31)),
    CONSTRAINT "HrCalculationPolicy_consignment_check" CHECK ("maxConsignmentMarginRate" IS NULL OR ("maxConsignmentMarginRate" >= 0 AND "maxConsignmentMarginRate" <= 100))
);

CREATE TABLE "HrEmploymentRegime" (
    "id" TEXT NOT NULL,
    "ruleSetId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "employmentNature" TEXT NOT NULL,
    "esocialCategory" TEXT,
    "defaultMonthlyHours" INTEGER,
    "socialSecuritySchemeId" TEXT,
    "vacationPolicyId" TEXT,
    "legalReference" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrEmploymentRegime_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "HrEmploymentRegime_hours_check" CHECK ("defaultMonthlyHours" IS NULL OR "defaultMonthlyHours" > 0)
);

CREATE TABLE "HrPayrollConfigurationChange" (
    "id" TEXT NOT NULL,
    "ruleSetId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "beforeValue" JSONB,
    "afterValue" JSONB,
    "actorUsuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HrPayrollConfigurationChange_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HrPayrollRuleSet_configuracaoInstanciaId_code_effectiveFrom_key" ON "HrPayrollRuleSet"("configuracaoInstanciaId", "code", "effectiveFrom");
CREATE INDEX "HrPayrollRuleSet_configuracaoInstanciaId_status_effectiveFrom_idx" ON "HrPayrollRuleSet"("configuracaoInstanciaId", "status", "effectiveFrom");
CREATE UNIQUE INDEX "HrPayrollRule_ruleSetId_code_key" ON "HrPayrollRule"("ruleSetId", "code");
CREATE INDEX "HrPayrollRule_ruleSetId_category_sortOrder_idx" ON "HrPayrollRule"("ruleSetId", "category", "sortOrder");
CREATE UNIQUE INDEX "HrPayrollRubric_ruleSetId_code_key" ON "HrPayrollRubric"("ruleSetId", "code");
CREATE INDEX "HrPayrollRubric_ruleSetId_type_priority_idx" ON "HrPayrollRubric"("ruleSetId", "type", "priority");
CREATE UNIQUE INDEX "HrPayrollRubricIncidence_rubricId_incidenceType_key" ON "HrPayrollRubricIncidence"("rubricId", "incidenceType");
CREATE INDEX "HrPayrollRubricIncidence_incidenceType_idx" ON "HrPayrollRubricIncidence"("incidenceType");
CREATE UNIQUE INDEX "HrSocialSecurityScheme_ruleSetId_code_key" ON "HrSocialSecurityScheme"("ruleSetId", "code");
CREATE INDEX "HrSocialSecurityScheme_ruleSetId_regime_isActive_idx" ON "HrSocialSecurityScheme"("ruleSetId", "regime", "isActive");
CREATE UNIQUE INDEX "HrSocialSecurityBand_socialSecuritySchemeId_sequence_key" ON "HrSocialSecurityBand"("socialSecuritySchemeId", "sequence");
CREATE INDEX "HrSocialSecurityBand_socialSecuritySchemeId_lowerLimit_idx" ON "HrSocialSecurityBand"("socialSecuritySchemeId", "lowerLimit");
CREATE UNIQUE INDEX "HrVacationPolicy_ruleSetId_code_key" ON "HrVacationPolicy"("ruleSetId", "code");
CREATE INDEX "HrVacationPolicy_ruleSetId_employmentNature_isActive_idx" ON "HrVacationPolicy"("ruleSetId", "employmentNature", "isActive");
CREATE UNIQUE INDEX "HrCalculationPolicy_ruleSetId_key" ON "HrCalculationPolicy"("ruleSetId");
CREATE UNIQUE INDEX "HrEmploymentRegime_ruleSetId_code_key" ON "HrEmploymentRegime"("ruleSetId", "code");
CREATE INDEX "HrEmploymentRegime_ruleSetId_employmentNature_isActive_idx" ON "HrEmploymentRegime"("ruleSetId", "employmentNature", "isActive");
CREATE INDEX "HrEmploymentRegime_socialSecuritySchemeId_idx" ON "HrEmploymentRegime"("socialSecuritySchemeId");
CREATE INDEX "HrEmploymentRegime_vacationPolicyId_idx" ON "HrEmploymentRegime"("vacationPolicyId");
CREATE INDEX "HrPayrollConfigurationChange_ruleSetId_createdAt_idx" ON "HrPayrollConfigurationChange"("ruleSetId", "createdAt");
CREATE INDEX "HrPayrollConfigurationChange_entityType_entityId_createdAt_idx" ON "HrPayrollConfigurationChange"("entityType", "entityId", "createdAt");
CREATE INDEX "HrPayrollConfigurationChange_actorUsuarioId_createdAt_idx" ON "HrPayrollConfigurationChange"("actorUsuarioId", "createdAt");

ALTER TABLE "HrPayrollRuleSet" ADD CONSTRAINT "HrPayrollRuleSet_configuracaoInstanciaId_fkey" FOREIGN KEY ("configuracaoInstanciaId") REFERENCES "ConfiguracaoInstancia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrPayrollRule" ADD CONSTRAINT "HrPayrollRule_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "HrPayrollRuleSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrPayrollRubric" ADD CONSTRAINT "HrPayrollRubric_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "HrPayrollRuleSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrPayrollRubricIncidence" ADD CONSTRAINT "HrPayrollRubricIncidence_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "HrPayrollRubric"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrSocialSecurityScheme" ADD CONSTRAINT "HrSocialSecurityScheme_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "HrPayrollRuleSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrSocialSecurityBand" ADD CONSTRAINT "HrSocialSecurityBand_socialSecuritySchemeId_fkey" FOREIGN KEY ("socialSecuritySchemeId") REFERENCES "HrSocialSecurityScheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrVacationPolicy" ADD CONSTRAINT "HrVacationPolicy_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "HrPayrollRuleSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrCalculationPolicy" ADD CONSTRAINT "HrCalculationPolicy_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "HrPayrollRuleSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrEmploymentRegime" ADD CONSTRAINT "HrEmploymentRegime_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "HrPayrollRuleSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrEmploymentRegime" ADD CONSTRAINT "HrEmploymentRegime_socialSecuritySchemeId_fkey" FOREIGN KEY ("socialSecuritySchemeId") REFERENCES "HrSocialSecurityScheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HrEmploymentRegime" ADD CONSTRAINT "HrEmploymentRegime_vacationPolicyId_fkey" FOREIGN KEY ("vacationPolicyId") REFERENCES "HrVacationPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HrPayrollConfigurationChange" ADD CONSTRAINT "HrPayrollConfigurationChange_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "HrPayrollRuleSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HrPayrollConfigurationChange" ADD CONSTRAINT "HrPayrollConfigurationChange_actorUsuarioId_fkey" FOREIGN KEY ("actorUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- O histórico de configuração é evidência append-only. A entidade configurada
-- pode mudar, mas seus snapshots anteriores não podem ser regravados ou
-- removidos por uma tela, action ou manutenção acidental.
CREATE OR REPLACE FUNCTION prevent_hr_payroll_configuration_change_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'HrPayrollConfigurationChange e append-only e nao pode ser alterado ou excluido';
END;
$$;

CREATE TRIGGER "HrPayrollConfigurationChange_append_only"
BEFORE UPDATE OR DELETE ON "HrPayrollConfigurationChange"
FOR EACH ROW EXECUTE FUNCTION prevent_hr_payroll_configuration_change_mutation();

-- Cria uma configuração didática apenas para a primeira instância já
-- cadastrada. Ela fica marcada como DEMONSTRAÇÃO e pode ser alterada na tela;
-- a Prefeitura deve substituí-la pela norma municipal antes de produção.
DO $$
DECLARE
  v_instance_id TEXT;
  v_rule_set_id TEXT;
  v_rpps_id TEXT;
  v_statutory_vacation_id TEXT;
  v_clt_vacation_id TEXT;
  v_rubric_id TEXT;
BEGIN
  SELECT "id" INTO v_instance_id
  FROM "ConfiguracaoInstancia"
  ORDER BY "createdAt" ASC
  LIMIT 1;

  IF v_instance_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO "HrPayrollRuleSet" (
    "id", "configuracaoInstanciaId", "code", "name", "status", "scope", "effectiveFrom", "legalReference", "notes", "isDemo", "createdAt", "updatedAt"
  ) VALUES (
    'rh-demo-rule-set-' || v_instance_id,
    v_instance_id,
    'MUNICIPAL_DEMO_2026',
    'Regras municipais — demonstração 2026',
    'ATIVA',
    'DEMONSTRACAO',
    TIMESTAMP '2026-01-01 00:00:00',
    'Configuração didática. Substituir por estatuto, plano de cargos, normas previdenciárias e atos municipais vigentes.',
    'Não representa folha oficial, remessa bancária, eSocial ou cálculo homologado.',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ) ON CONFLICT ("configuracaoInstanciaId", "code", "effectiveFrom") DO NOTHING;

  SELECT "id" INTO v_rule_set_id
  FROM "HrPayrollRuleSet"
  WHERE "configuracaoInstanciaId" = v_instance_id
    AND "code" = 'MUNICIPAL_DEMO_2026'
    AND "effectiveFrom" = TIMESTAMP '2026-01-01 00:00:00'
  LIMIT 1;

  INSERT INTO "HrCalculationPolicy" (
    "id", "ruleSetId", "currency", "roundingMode", "roundingScale", "movementCutoffDay", "paymentDay", "negativeNetPayPolicy", "maxConsignmentMarginRate", "freezeOnClose", "legalReference", "notes", "createdAt", "updatedAt"
  ) VALUES (
    'rh-demo-calculation-' || v_rule_set_id,
    v_rule_set_id,
    'BRL', 'HALF_UP', 2, 20, 30, 'BLOQUEAR', 30.000000, true,
    'Valores de demonstração para conferência. Validar calendário, margem e teto com RH, Contabilidade e Jurídico.',
    'A política deverá ser copiada para o snapshot imutável da competência no futuro motor de folha.',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ) ON CONFLICT ("ruleSetId") DO NOTHING;

  INSERT INTO "HrPayrollRule" (
    "id", "ruleSetId", "category", "code", "name", "description", "valueType", "value", "unit", "sortOrder", "legalReference", "isRequired", "isActive", "createdAt", "updatedAt"
  ) VALUES
    ('rh-demo-rule-competence-' || v_rule_set_id, v_rule_set_id, 'CALCULO', 'COMPETENCIA_PADRAO', 'Tipo padrão de competência', 'Referência usada na demonstração de cálculo.', 'TEXT', '"MENSAL"'::jsonb, NULL, 10, NULL, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('rh-demo-rule-order-' || v_rule_set_id, v_rule_set_id, 'CALCULO', 'ORDEM_RUBRICAS', 'Ordem das rubricas', 'A folha futura deve avaliar rubricas em prioridade crescente.', 'TEXT', '"PRIORIDADE_CRESCENTE"'::jsonb, NULL, 20, NULL, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('rh-demo-rule-freeze-' || v_rule_set_id, v_rule_set_id, 'CALCULO', 'CONGELAR_CONFIGURACAO_NO_FECHAMENTO', 'Congelar regras ao fechar', 'Impede que alteração de parâmetro reescreva competência fechada.', 'BOOLEAN', 'true'::jsonb, NULL, 30, NULL, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('rh-demo-rule-vacation-bonus-' || v_rule_set_id, v_rule_set_id, 'FERIAS', 'ADICIONAL_FERIAS_PERCENTUAL', 'Adicional de férias', 'Valor demonstrativo de um terço, editável por política e rubrica.', 'PERCENTAGE', '33.333333'::jsonb, '%', 40, 'Demonstrativo. Validar com a norma do vínculo.', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('rh-demo-rule-consignment-' || v_rule_set_id, v_rule_set_id, 'CONSIGNACAO', 'MARGEM_MAXIMA_PERCENTUAL', 'Margem consignável máxima', 'Percentual demonstrativo; convênio e legislação local prevalecem.', 'PERCENTAGE', '30'::jsonb, '%', 50, 'Demonstração. Substituir pelo limite vigente aplicável.', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('rh-demo-rule-portal-' || v_rule_set_id, v_rule_set_id, 'PORTAL', 'PUBLICAR_SOMENTE_FOLHA_FECHADA', 'Publicar somente após fechamento', 'O Portal do Servidor só pode receber demonstrativos autorizados.', 'BOOLEAN', 'true'::jsonb, NULL, 60, NULL, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('rh-demo-rule-portal-statements-' || v_rule_set_id, v_rule_set_id, 'PORTAL', 'PORTAL_DEMONSTRATIVOS_HABILITADOS', 'Disponibilizar demonstrativos no Portal', 'Controla a consulta de demonstrativos pelo próprio servidor no Portal do Servidor.', 'BOOLEAN', 'true'::jsonb, NULL, 65, 'Demonstração. Não altera o filtro de folhas fechadas ou pagas.', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('rh-demo-rule-social-' || v_rule_set_id, v_rule_set_id, 'PREVIDENCIA', 'VALIDAR_PREVIDENCIA_ANTES_PRODUCAO', 'Validação de previdência obrigatória', 'As alíquotas e faixas abaixo são exclusivamente demonstrativas.', 'BOOLEAN', 'true'::jsonb, NULL, 70, 'Não utilizar para recolhimento sem homologação municipal.', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT ("ruleSetId", "code") DO NOTHING;

  INSERT INTO "HrVacationPolicy" (
    "id", "ruleSetId", "code", "name", "employmentNature", "acquisitionMonths", "concessionMonths", "entitlementDays", "maxSplits", "minFirstSplitDays", "minOtherSplitDays", "additionalPayRate", "allowsCashAbono", "maxCashAbonoDays", "allowsAdvanceThirteenth", "requiresApproval", "legalReference", "notes", "isActive", "createdAt", "updatedAt"
  ) VALUES
    ('rh-demo-vacation-statutory-' || v_rule_set_id, v_rule_set_id, 'ESTATUTARIO_DEMO', 'Férias estatutárias — demonstração', 'ESTATUTARIO', 12, 12, 30, 3, 14, 5, 33.333333, false, 0, false, true, 'Demonstração. O estatuto municipal e atos vigentes devem substituir estes valores antes de produção.', 'Abono e antecipação ficam desativados até validação normativa.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('rh-demo-vacation-clt-' || v_rule_set_id, v_rule_set_id, 'CLT_PADRAO', 'Férias CLT — referência parametrizável', 'CLT', 12, 12, 30, 3, 14, 5, 33.333333, true, 10, true, true, 'Referência demonstrativa da CLT. Confirmar regras aplicáveis, convenções e atos municipais antes de produção.', 'Abono e antecipação do décimo terceiro exigem validação do RH antes do uso em folha oficial.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT ("ruleSetId", "code") DO NOTHING;

  SELECT "id" INTO v_statutory_vacation_id
  FROM "HrVacationPolicy"
  WHERE "ruleSetId" = v_rule_set_id
    AND "code" = 'ESTATUTARIO_DEMO'
  LIMIT 1;

  SELECT "id" INTO v_clt_vacation_id
  FROM "HrVacationPolicy"
  WHERE "ruleSetId" = v_rule_set_id
    AND "code" = 'CLT_PADRAO'
  LIMIT 1;

  INSERT INTO "HrSocialSecurityScheme" (
    "id", "ruleSetId", "code", "name", "regime", "employeeCalculationMethod", "ceilingValue", "employerContributionRate", "actuarialContributionRate", "legalReference", "notes", "isActive", "createdAt", "updatedAt"
  ) VALUES (
    'rh-demo-rpps-' || v_rule_set_id,
    v_rule_set_id,
    'RPPS_MUNICIPAL_DEMO',
    'RPPS municipal — demonstração',
    'RPPS',
    'PROGRESSIVA',
    4000.00,
    20.000000,
    NULL,
    'Faixas sintéticas de demonstração. Substituir pela legislação e avaliação atuarial vigentes do ente.',
    'Não utilizar estas alíquotas para retenção ou recolhimento oficial.',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ) ON CONFLICT ("ruleSetId", "code") DO NOTHING;

  SELECT "id" INTO v_rpps_id
  FROM "HrSocialSecurityScheme"
  WHERE "ruleSetId" = v_rule_set_id
    AND "code" = 'RPPS_MUNICIPAL_DEMO'
  LIMIT 1;

  INSERT INTO "HrSocialSecurityBand" (
    "id", "socialSecuritySchemeId", "sequence", "lowerLimit", "upperLimit", "employeeRate", "employerRate", "createdAt", "updatedAt"
  ) VALUES
    ('rh-demo-rpps-band-1-' || v_rpps_id, v_rpps_id, 1, 0.00, 1000.00, 5.000000, 20.000000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('rh-demo-rpps-band-2-' || v_rpps_id, v_rpps_id, 2, 1000.01, 3000.00, 10.000000, 20.000000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('rh-demo-rpps-band-3-' || v_rpps_id, v_rpps_id, 3, 3000.01, 4000.00, 15.000000, 20.000000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT ("socialSecuritySchemeId", "sequence") DO NOTHING;

  INSERT INTO "HrPayrollRubric" (
    "id", "ruleSetId", "code", "name", "type", "esocialNatureCode", "calculationMethod", "formulaExpression", "calculationBaseCode", "fixedValue", "percentageRate", "priority", "legalReference", "notes", "isActive", "createdAt", "updatedAt"
  ) VALUES (
    'rh-demo-rubric-base-' || v_rule_set_id,
    v_rule_set_id,
    'VENCIMENTO_BASE_DEMO',
    'Vencimento-base — demonstração',
    'PROVENTO',
    NULL,
    'MANUAL',
    NULL,
    NULL,
    NULL,
    NULL,
    10,
    'Rubrica demonstrativa. Validar natureza, incidências e mapeamento eSocial antes de produção.',
    'Base ilustrativa para testar a configuração versionada; não integra o motor de folha legado.',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ) ON CONFLICT ("ruleSetId", "code") DO NOTHING;

  SELECT "id" INTO v_rubric_id
  FROM "HrPayrollRubric"
  WHERE "ruleSetId" = v_rule_set_id
    AND "code" = 'VENCIMENTO_BASE_DEMO'
  LIMIT 1;

  INSERT INTO "HrPayrollRubricIncidence" (
    "id", "rubricId", "incidenceType", "isIncluded", "createdAt", "updatedAt"
  ) VALUES
    ('rh-demo-incidence-rpps-' || v_rubric_id, v_rubric_id, 'RPPS', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('rh-demo-incidence-irrf-' || v_rubric_id, v_rubric_id, 'IRRF', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('rh-demo-incidence-vacation-' || v_rubric_id, v_rubric_id, 'FERIAS', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('rh-demo-incidence-thirteenth-' || v_rubric_id, v_rubric_id, 'DECIMO_TERCEIRO', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('rh-demo-incidence-ceiling-' || v_rubric_id, v_rubric_id, 'TETO_REMUNERATORIO', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT ("rubricId", "incidenceType") DO NOTHING;

  INSERT INTO "HrPayrollRubric" (
    "id", "ruleSetId", "code", "name", "type", "esocialNatureCode", "calculationMethod", "formulaExpression", "calculationBaseCode", "fixedValue", "percentageRate", "priority", "legalReference", "notes", "isActive", "createdAt", "updatedAt"
  ) VALUES
    ('rh-demo-rubric-vacation-' || v_rule_set_id, v_rule_set_id, 'ADICIONAL_FERIAS_DEMO', 'Adicional de férias — demonstração', 'PROVENTO', NULL, 'PERCENTUAL', NULL, 'VENCIMENTO_BASE_DEMO', NULL, 33.333333, 20, 'Demonstração de um terço. Confirmar incidências e critérios do vínculo antes de produção.', 'A política de férias mantém a fonte de verdade deste percentual.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('rh-demo-rubric-social-security-' || v_rule_set_id, v_rule_set_id, 'PREVIDENCIA_SERVIDOR_DEMO', 'Contribuição do servidor — demonstração', 'DESCONTO', NULL, 'FORMULA_CONTROLADA', 'VENCIMENTO_BASE_DEMO * 10 / 100', 'VENCIMENTO_BASE_DEMO', NULL, NULL, 30, 'Alíquota exclusivamente didática. A tabela previdenciária vigente deve ser parametrizada e homologada.', 'Usada apenas para conferir o catálogo e as prioridades da demonstração.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('rh-demo-rubric-employer-charge-' || v_rule_set_id, v_rule_set_id, 'ENCARGO_PATRONAL_DEMO', 'Encargo patronal — demonstração', 'INFORMATIVA', NULL, 'FORMULA_CONTROLADA', 'VENCIMENTO_BASE_DEMO * 20 / 100', 'VENCIMENTO_BASE_DEMO', NULL, NULL, 40, 'Valor ilustrativo, separado do líquido do servidor e sujeito à validação atuarial e contábil.', 'Não representa guia, obrigação de recolhimento ou lançamento contábil oficial.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('rh-demo-rubric-consignment-' || v_rule_set_id, v_rule_set_id, 'CONSIGNACAO_DEMO', 'Consignação — demonstração', 'DESCONTO', NULL, 'MANUAL', NULL, NULL, NULL, NULL, 50, 'Demonstração. Convênio, margem e autorização do servidor devem ser validados antes de produção.', 'A política de cálculo contém a margem máxima demonstrativa.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT ("ruleSetId", "code") DO NOTHING;

  INSERT INTO "HrEmploymentRegime" (
    "id", "ruleSetId", "code", "name", "employmentNature", "esocialCategory", "defaultMonthlyHours", "socialSecuritySchemeId", "vacationPolicyId", "legalReference", "isActive", "createdAt", "updatedAt"
  ) VALUES
    ('rh-demo-regime-statutory-' || v_rule_set_id, v_rule_set_id, 'ESTATUTARIO_DEMO', 'Vínculo estatutário — demonstração', 'ESTATUTARIO', NULL, NULL, v_rpps_id, v_statutory_vacation_id, 'Demonstração. A vinculação efetiva depende do estatuto e do enquadramento previdenciário municipal.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('rh-demo-regime-clt-' || v_rule_set_id, v_rule_set_id, 'CLT_DEMO', 'Vínculo CLT — demonstração', 'CLT', NULL, NULL, NULL, v_clt_vacation_id, 'Demonstração. O enquadramento RGPS, jornada e categoria eSocial devem ser validados antes de produção.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT ("ruleSetId", "code") DO NOTHING;
END;
$$;
