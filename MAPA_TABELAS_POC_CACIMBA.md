# Mapa de Tabelas da POC de Cacimba

Data do levantamento: 24/09/2026

## 1. Resposta objetiva

As tabelas estão definidas em `prisma/schema.prisma`. Os nomes físicos são iguais aos nomes dos models Prisma, pois o schema não utiliza `@@map` ou `@map`.

Não é seguro criar somente algumas tabelas ou executar migrations escolhidas pelo nome do módulo. O projeto possui um schema monolítico, com relações compartilhadas entre Tributação, Folha, Frotas, Farmácia, usuários, documentos, patrimônio, estoque, processos e financeiro.

Para o Neon novo, a estratégia recomendada é:

1. Criar o schema Prisma completo.
2. Manter inativos, por configuração e perfil, os módulos que não fazem parte da POC.
3. Migrar ou criar dados somente dos módulos necessários.
4. Gerar um novo baseline próprio de Cacimba para controlar as próximas alterações.

Criar todas as tabelas não significa exibir ou utilizar todos os módulos. Essa separação deve ser feita por `ConfiguracaoModulo`, `UsuarioModulo`, perfis e menus.

## 2. Estado atual do Neon

A conexão com Neon e a presença do token do Blob foram validadas sem exposição dos valores.

O estado parcial herdado das migrations de Divino foi removido após confirmação explícita de que o banco era novo e exclusivo da POC. O schema completo foi criado a partir de `prisma/schema.prisma`.

Situação atual:

- baseline `20260924000000_baseline` aplicada com sucesso;
- migrations ativas em `prisma/migrations-cacimba`;
- migrations históricas de Divino preservadas em `prisma/migrations`, fora do caminho ativo;
- `prisma migrate status` informa que o banco está atualizado;
- `prisma migrate diff` não detecta diferença entre Neon e schema Prisma;
- Prisma Client gerado com sucesso;
- build de produção aprovado.

### 2.1 Motivo do baseline próprio

A migration histórica `20260801000000_baseline` de Divino não possui DDL. Ela pressupõe um banco legado já existente e, por isso, não podia inicializar o Neon vazio de Cacimba.

O arquivo `prisma.config.ts` agora aponta para `prisma/migrations-cacimba`. Novas alterações de schema devem gerar migrations nesse diretório, sem executar novamente a cadeia incremental que dependia do banco legado de Divino.

## 3. Dependências compartilhadas

### 3.1 Instituição e organograma

- `Institution`
- `ConfiguracaoInstancia`
- `ConfiguracaoParametroInstancia`
- `ConfiguracaoModulo`
- `Secretariat`
- `Department`
- `AdministrativeUnit`
- `Role`
- `Employee`
- `CalendarEvent`

### 3.2 Pessoas e fornecedores

- `Person`
- `Company`
- `Taxpayer`
- `Supplier`
- `Creditor`
- `LegalRepresentative`
- `Address`
- `Neighborhood`
- `Street`
- `PersonMergeRequest`
- `PersonMergeLedger`

### 3.3 Usuários e permissões

- `ConfiguracaoPerfil`
- `Usuario`
- `ConfiguracaoModulo`
- `UsuarioModulo`
- `UsuarioUnidadeGestora`
- `HealthUserAccessScope`
- `TaxpayerPortalAccess`

### 3.4 Documentos e auditoria

- `DocumentClass`
- `Document`
- `DocumentVersion`
- `DocumentSignature`
- `Folder`
- `AuditEvent`
- `TaxAuditLog`
- `FinancialAuditLog`
- `ReportTemplate`
- `PublicNotice`

### 3.5 Processos e protocolos

- `ProcessType`
- `Subject`
- `Process`
- `ProcessMovement`
- `ProcessWorkflowStage`
- `ProcessDocument`
- `ProcessDispatch`
- `ProcessEvent`
- `ProtocolNotification`
- `ProcessSequence`
- `GenericProcessWorkflowDefinition`
- `GenericProcessWorkflowStage`
- `GenericProcessWorkflowInstance`
- `GenericProcessWorkflowEvent`

### 3.6 Integrações

- `IntegrationConnection`
- `IntegrationRun`
- `SiaficEntityVersion`
- `SiaficOutboxEvent`
- `SiaficDelivery`
- `SiaficDeliveryAttempt`
- `SiaficExternalLink`

Essas tabelas ainda não representam SAGRES Folha, Frota ou Farmácia. Novas estruturas serão necessárias durante o desenvolvimento dessas integrações.

## 4. Gestão Tributária

### 4.1 Cadastro e base territorial

- `Taxpayer`
- `RealEstate`
- `EconomicRegistration`
- `PropertyValuation`
- `TaxRegistryEntry`
- `Address`
- `Neighborhood`
- `Street`

### 4.2 Tributos, lançamentos, DAM e baixa

- `Tax`
- `TaxParameter`
- `TaxServiceActivity`
- `TaxDeclaration`
- `TaxAssessment`
- `TaxGuide`
- `TaxPayment`
- `TaxDocumentSequence`
- `TaxFinancialMapping`
- `TaxRevenueIntegrationEvent`

### 4.3 Financeiro mínimo tributário

- `FinancialYear`
- `RevenueNature`
- `ResourceSource`
- `BankAccount`
- `Revenue`
- `TreasuryMovement`
- `BankStatementImport`
- `BankStatementItem`
- `BankReconciliation`

### 4.4 Certidões, alvarás e serviços

- `License`
- `TaxCertificate`
- `TaxCertificateEvaluation`
- `TaxServiceRequest`
- `TaxCaseLink`

### 4.5 Dívida ativa, cobrança e parcelamento

- `ActiveDebt`
- `TaxActiveDebtEvent`
- `TaxCdaVersion`
- `TaxDebtSuspension`
- `TaxDaPortfolio`
- `TaxDaPortfolioItem`
- `TaxProtestBatch`
- `TaxProtestItem`
- `TaxExecutionBatch`
- `TaxExecutionCase`
- `TaxExecutionEvent`
- `DebtInstallment`
- `DebtInstallmentSchedule`
- `TaxCollectionProfile`
- `TaxCollectionPortfolio`
- `TaxCollectionPortfolioItem`
- `TaxCollectionRule`
- `TaxCollectionAction`
- `TaxCollectionActionEvent`
- `TaxInstallmentRule`
- `TaxInstallmentAgreement`
- `TaxInstallmentDebt`
- `TaxInstallmentQuota`
- `TaxInstallmentPaymentAllocation`
- `TaxInstallmentEvent`
- `TaxBenefitRule`
- `TaxBenefitGrant`

### 4.6 ITBI e DTE

- `ItbiTransactionType`
- `ItbiDeclaration`
- `ItbiParty`
- `ItbiEvent`
- `DteMailbox`
- `DteAccessGrant`
- `DteCategory`
- `DteMessage`
- `DteMessageEvent`
- `DtePowerOfAttorney`
- `DtePowerOfAttorneyEvent`

### 4.7 NFS-e

- `Invoice`
- `NfseCredentialRequest`
- `NfseCredentialEvent`
- `NfseInvoiceData`
- `NfseEvent`
- `NfseCorrectionLetter`
- `NfseRpsBatch`
- `NfseRpsItem`
- `NfseDmsDeclaration`
- `NfseOccasionalRequest`
- `NfseDeductionCredit`
- `NfseDeductionConsumption`

### 4.8 Simples Nacional e fiscalização

- `SimplesImportBatch`
- `SimplesFiscalRecord`
- `SimplesOptionPeriod`
- `SimplesDivergence`
- `SimplesRegularizationEvent`
- `SimplesExclusionCase`
- `SimplesPaymentAllocation`
- `Infraction`
- `TaxAuditCrossCheck`
- `FiscalAuditPlan`
- `FiscalAuditPlanSelection`
- `FiscalAuditPlanInspector`
- `FiscalAuditPlanEvent`
- `FiscalServiceOrder`
- `FiscalServiceOrderEvent`
- `FiscalInspectionDocument`
- `FiscalDocumentRequest`
- `FiscalAssessmentMap`
- `FiscalDocumentTemplate`
- `FiscalPenaltyRule`
- `FiscalMeshFinding`
- `FiscalMeshOrderLink`

## 5. Portal do Contribuinte

O portal não deve ter cópia própria dos dados tributários. Ele reutiliza:

- `TaxpayerPortalAccess`;
- `Usuario` e tabelas de permissão;
- `Taxpayer`, `Person` e `Company`;
- `RealEstate` e `EconomicRegistration`;
- `TaxAssessment`, `TaxGuide` e `TaxPayment`;
- `ActiveDebt` e tabelas de parcelamento;
- `TaxCertificate` e `License`;
- tabelas de ITBI e DTE;
- `Process` e `Document`.

Para as páginas institucionais internas também são utilizadas:

- `PortalPage`
- `PortalMenu`
- `PublicService`
- `OfficialPublication`

## 6. Folha e Portal do Servidor

### 6.1 Cadastro funcional

- `Employee`
- `Person`
- `Role`
- `Secretariat`
- `Department`
- `AdministrativeUnit`
- `Vacation`
- `Leave`
- `AttendanceRecord`
- `Dependent`
- `BenefitConfig`
- `PayrollBenefit`
- `PersonnelAct`

### 6.2 Folha existente

- `Payroll`
- `PayrollEvent`
- `PayrollItem`

### 6.3 Parametrização nova

- `HrPayrollRuleSet`
- `HrPayrollRule`
- `HrPayrollRubric`
- `HrPayrollRubricIncidence`
- `HrSocialSecurityScheme`
- `HrSocialSecurityBand`
- `HrVacationPolicy`
- `HrCalculationPolicy`
- `HrEmploymentRegime`
- `HrPayrollConfigurationChange`

O Portal do Servidor não possui tabelas próprias. Ele consulta diretamente `Usuario`, `Employee`, Folha, férias, afastamentos, ponto, benefícios, atos e GED.

Ainda não existem tabelas suficientes para vínculo funcional múltiplo, snapshot da competência, memória de cálculo, ficha financeira, informe de rendimentos, CNAB, eSocial ou SAGRES Mensal.

## 7. Gestão de Frotas e futuro Portal da Frota

### 7.1 Núcleo de Frotas

- `FleetUnit`
- `FleetRoute`
- `FleetUsage`
- `FleetPlan`
- `FleetWorkOrder`
- `FleetConsumption`
- `FleetExpense`
- `FleetDocument`
- `FleetOccurrence`
- `FleetMutation`
- `FleetAssetEvent`

### 7.2 Patrimônio e estoque compartilhados

- `AssetCategory`
- `Asset`
- `AssetMaintenance`
- `AssetTransfer`
- `AssetWriteOff`
- `MaterialCategory`
- `Material`
- `MaterialStock`
- `MaterialMovement`
- `Warehouse`
- `CostCenter`

O Portal da Frota ainda não possui tabelas próprias. Ele deverá projetar os dados de `Fleet*`, organograma, instituição e relatórios, com regras de sanitização e publicação.

Ainda não existem tabelas suficientes para CNH do condutor, regime de posse/locação, autorização de abastecimento, horímetro, fechamento mensal ou SAGRES Frota.

## 8. Farmácia

### 8.1 Unidades, pacientes e profissionais

- `HealthUnit`
- `Patient`
- `HealthProfessional`
- `HealthTeam`
- `HealthProfessionalAssignment`
- `HealthUserAccessScope`
- `Person`
- `Employee`

### 8.2 Produtos e estoque

- `MaterialCategory`
- `Material`
- `HealthMaterialProfile`
- `Medicine`
- `MedicineInteraction`
- `MedicineDosageTemplate`
- `Warehouse`
- `CostCenter`
- `MaterialStock`
- `MaterialMovement`
- `HealthStockPolicy`
- `InventorySession`
- `InventorySessionItem`

### 8.3 Entradas, transferências e pedidos

- `HealthStockReceipt`
- `HealthStockReceiptItem`
- `HealthStockTransfer`
- `HealthStockTransferItem`
- `PharmacyRequest`
- `PharmacyRequestItem`
- `Supplier`
- `Document`

### 8.4 Prescrição e dispensação

- `HealthPrescription`
- `HealthPrescriptionItem`
- `MedicineDispensation`
- `MedicineBatch`
- `MedicalRecord`
- `HealthClinicalDocument`
- `ControlledMedicineBook`

Ainda não existem tabelas suficientes para reserva de medicamentos, alertas persistidos, posição mensal fechada, receituário regulatório completo ou SAGRES Farmácia.

## 9. Próximas etapas do banco

As etapas de limpeza, baseline, aplicação do schema, verificação de drift e geração do Prisma Client foram concluídas.

Ainda é necessário:

1. Cadastrar a instância e a instituição de Cacimba.
2. Cadastrar os módulos contratados e o primeiro administrador.
3. Revisar e executar somente seeds adequados a Cacimba.
4. Preparar um banco ou schema isolado para testes que gravam dados.
5. Corrigir a suíte legada antes de adotá-la como critério de aceite.
6. Validar o Blob com upload e leitura controlados.

Para implantações futuras, o comando normal será `npx prisma migrate deploy`, utilizando o diretório configurado em `prisma.config.ts`.
