export type SheetImportMode = "IMPORT" | "ENRICH" | "VALIDATE_ONLY";

export type SheetImportDefinition = {
  mode: SheetImportMode;
  target: string;
  reason?: string;
};

export const EXCEL_DEMO_IMPORT_MANIFEST: Record<string, SheetImportDefinition> = {
  "05_Orgaos": { mode: "IMPORT", target: "Secretariat + Department" },
  "06_Unidades": { mode: "IMPORT", target: "AdministrativeUnit" },
  "07_Cargos": { mode: "IMPORT", target: "Role" },
  "08_Servidores": { mode: "IMPORT", target: "Employee" },
  "09_Logradouros": { mode: "IMPORT", target: "Neighborhood + Street" },
  "10_Domicilios": { mode: "ENRICH", target: "Address", reason: "Endereço é materializado por pessoa porque Address não representa domicílio compartilhado." },
  "11_Pessoas": { mode: "IMPORT", target: "Person" },
  "12_Folha": { mode: "IMPORT", target: "Payroll + PayrollEvent + PayrollItem" },
  "13_Imob_Tributario": { mode: "IMPORT", target: "RealEstate" },
  "14_Escolas": { mode: "IMPORT", target: "School" },
  "15_Turmas": { mode: "IMPORT", target: "Teacher + SchoolClass" },
  "16_Alunos": { mode: "IMPORT", target: "Student + EducationalGuardian" },
  "17_Matriculas": { mode: "IMPORT", target: "Enrollment" },
  "18_Frequencia": { mode: "VALIDATE_ONLY", target: "Attendance", reason: "A origem é consolidada mensal; o modelo atual exige frequência por diário/aula." },
  "19_Almoxarifados": { mode: "IMPORT", target: "Warehouse" },
  "20_Fornecedores": { mode: "IMPORT", target: "Company + Supplier + Creditor" },
  "21_Materiais": { mode: "IMPORT", target: "MaterialCategory + Material" },
  "22_Estoque": { mode: "IMPORT", target: "MaterialStock" },
  "23_Mov_Estoque": { mode: "IMPORT", target: "MaterialMovement" },
  "24_Frota": { mode: "IMPORT", target: "FleetUnit" },
  "25_Abastecimentos": { mode: "IMPORT", target: "FleetConsumption + FleetExpense" },
  "26_Manutencoes": { mode: "IMPORT", target: "AssetMaintenance + FleetExpense" },
  "27_Imoveis_Publicos": { mode: "IMPORT", target: "RealEstate + Asset" },
  "28_Bens_Moveis": { mode: "IMPORT", target: "Asset" },
  "29_Semoventes": { mode: "IMPORT", target: "Asset" },
  "30_Intangiveis": { mode: "IMPORT", target: "Asset" },
  "31_Atend_Social": { mode: "IMPORT", target: "SocialFamily + SocialUnit + SocialAttendance" },
  "32_Atend_Saude": { mode: "IMPORT", target: "HealthAppointment" },
  "33_Protocolos": { mode: "IMPORT", target: "Process" },
  "34_Contratos": { mode: "IMPORT", target: "Contract" },
  "35_Rotas_Escolares": { mode: "IMPORT", target: "FleetRoute" },
  "36_Usuarios": { mode: "IMPORT", target: "ConfiguracaoPerfil + Usuario" },
  "37_Estabelec_Saude": { mode: "IMPORT", target: "HealthUnit" },
  "38_Pacientes": { mode: "IMPORT", target: "Patient" },
  "39_Usuarios_Servicos": { mode: "VALIDATE_ONLY", target: "sem tabela canônica", reason: "É uma visão transversal de vínculos já representados em Student e Patient." },
  "40_Equipes_Unidades": { mode: "ENRICH", target: "Teacher + HealthProfessional" },
  "41_Prof_Parceiros": { mode: "VALIDATE_ONLY", target: "HealthProfessional", reason: "O schema exige Employee, enquanto a origem declara profissionais externos fora da folha." },
  "42_Ambientes_Unidades": { mode: "VALIDATE_ONLY", target: "sem tabela canônica", reason: "Não existe entidade de ambiente físico no schema atual." },
  "43_Leitos": { mode: "VALIDATE_ONLY", target: "sem tabela canônica", reason: "Não existe entidade de leito no schema atual." },
  "44_Agenda_Integrada": { mode: "ENRICH", target: "HealthAppointment", reason: "É projeção dos atendimentos da aba 32." },
  "45_Internacoes": { mode: "VALIDATE_ONLY", target: "sem tabela canônica", reason: "Não existe entidade de internação no schema atual." },
  "46_Encaminhamentos": { mode: "VALIDATE_ONLY", target: "HealthReferral", reason: "A origem referencia profissional parceiro, mas o schema exige HealthProfessional vinculado a Employee." },
  "47_Catalogo_Serv_Bens": { mode: "IMPORT", target: "CatalogItem" },
  "48_Processos_Compra": { mode: "IMPORT", target: "PurchaseProcess" },
  "49_Gestao_Contratos": { mode: "ENRICH", target: "Contract" },
  "50_Itens_Contratos": { mode: "IMPORT", target: "PurchaseProcessItem" },
  "51_Solicitacoes_Compra": { mode: "IMPORT", target: "PurchaseRequest" },
  "52_Itens_Solicitacoes": { mode: "IMPORT", target: "PurchaseRequestItem" },
  "53_Cotacoes": { mode: "IMPORT", target: "PriceResearch + PriceQuote" },
  "54_Pedidos_Compra": { mode: "VALIDATE_ONLY", target: "sem tabela canônica", reason: "O schema atual não possui pedido de compra." },
  "55_Itens_Pedidos": { mode: "VALIDATE_ONLY", target: "sem tabela canônica", reason: "O schema atual não possui item de pedido de compra." },
  "56_Recebimentos": { mode: "ENRICH", target: "PurchaseReceipt", reason: "Somente recebimentos estocáveis têm os vínculos obrigatórios do schema." },
  "57_Notas_Fiscais": { mode: "VALIDATE_ONLY", target: "sem tabela canônica equivalente", reason: "Invoice representa nota de serviço tributária, não documento fiscal de compra." },
  "58_Dotacoes": { mode: "IMPORT", target: "BudgetAppropriation" },
  "59_Empenhos": { mode: "IMPORT", target: "Commitment" },
  "60_Liquidacoes": { mode: "IMPORT", target: "Settlement" },
  "61_Pagamentos": { mode: "IMPORT", target: "Payment" },
  "62_Destinos_Receb": { mode: "ENRICH", target: "PurchaseReceiptItem" },
  "63_Mov_Patrimoniais": { mode: "IMPORT", target: "AssetTransfer" },
  "64_Inventario_Patrimonial": { mode: "VALIDATE_ONLY", target: "sem tabela canônica", reason: "InventorySession é inventário de estoque, não inventário patrimonial." },
  "65_Viagens_Frota": { mode: "IMPORT", target: "FleetUsage" },
  "66_Passageiros": { mode: "VALIDATE_ONLY", target: "sem tabela canônica", reason: "FleetUsage não possui passageiros no schema atual." },
  "67_Manutencao_Predial": { mode: "IMPORT", target: "AssetMaintenance" },
  "68_Tramites_Protocolos": { mode: "IMPORT", target: "ProcessMovement" },
  "69_Documentos_Fluxos": { mode: "IMPORT", target: "Document" },
  "70_Eventos_Fluxos": { mode: "IMPORT", target: "ProcurementLifecycleEvent" },
  "71_Diario_Escolar": { mode: "VALIDATE_ONLY", target: "ClassDiary", reason: "A origem é avaliação individual; ClassDiary é diário coletivo por turma." },
  "72_Merenda_Diaria": { mode: "IMPORT", target: "SchoolMeal" },
  "73_Requisicoes_Internas": { mode: "IMPORT", target: "MaterialRequest + MaterialRequestItem" },
};

export function validateImportManifest(sheetNames: Iterable<string>) {
  const names = [...sheetNames];
  const missing = names.filter((name) => !EXCEL_DEMO_IMPORT_MANIFEST[name]);
  const stale = Object.keys(EXCEL_DEMO_IMPORT_MANIFEST).filter((name) => !names.includes(name));
  return { missing, stale };
}

