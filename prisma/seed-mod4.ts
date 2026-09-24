import { prisma } from '../src/lib/prisma';

async function upsertFolder(name: string, description: string, parentId?: string) {
  const existing = await prisma.folder.findFirst({ where: { name, parentId: parentId ?? null } });
  if (existing) return existing;
  return prisma.folder.create({ data: { name, description, parentId: parentId ?? null } });
}

async function upsertDocument(title: string, data: {
  documentType: string;
  fileUrl: string;
  status?: string;
  notes?: string | null;
  folderId?: string | null;
}) {
  const existing = await prisma.document.findFirst({ where: { title, documentType: data.documentType } });
  if (existing) return existing;
  return prisma.document.create({ data: { title, ...data, status: data.status ?? 'Válido' } });
}

async function main() {
  console.log('\n🚀 Iniciando seed do Módulo 4 (Documentação e GED)...\n');

  // ─── PASTAS PRINCIPAIS ───────────────────────────────────────
  const rhFolder        = await upsertFolder('Recursos Humanos',         'Documentos do setor de RH');
  const licitacoesFolder = await upsertFolder('Licitações e Contratos',  'Editais, contratos e termos de referência');
  const projetosFolder  = await upsertFolder('Projetos Especiais',       'Projetos da prefeitura');
  const financeiroFolder = await upsertFolder('Financeiro',              'Balancetes, empenhos e relatórios financeiros');
  const juridicaFolder  = await upsertFolder('Assessoria Jurídica',      'Pareceres e processos judiciais');
  console.log('✅ Pastas principais criadas.');

  // ─── SUBPASTAS ───────────────────────────────────────────────
  await upsertFolder('Folha de Pagamento 2026', 'Contracheques e folhas mensais', rhFolder.id);
  await upsertFolder('Licitações 2025',         'Histórico de licitações do ano anterior', licitacoesFolder.id);
  console.log('✅ Subpastas criadas.');

  // ─── DOCUMENTOS NO GED ──────────────────────────────────────
  const gedDocs: Array<{ title: string; documentType: string; folderId: string }> = [
    // RH
    { title: 'Regulamento Interno de RH — Rev. 3',                         documentType: 'Norma',     folderId: rhFolder.id },
    { title: 'Plano de Cargos e Salários 2026',                            documentType: 'Relatório',  folderId: rhFolder.id },
    { title: 'Convocação Concurso Público 001/2026',                       documentType: 'Edital',    folderId: rhFolder.id },
    // Licitações
    { title: 'Edital Pregão Eletrônico 05/2026 — Merenda Escolar',         documentType: 'Edital',    folderId: licitacoesFolder.id },
    { title: 'Contrato 012/2026 — Fornecimento de Merenda',                documentType: 'Contrato',  folderId: licitacoesFolder.id },
    { title: 'Ata de Registro de Preços — Papel e Materiais de Escritório',documentType: 'Ata',       folderId: licitacoesFolder.id },
    { title: 'Termo de Referência — Manutenção de Vias Públicas',          documentType: 'Termo',     folderId: licitacoesFolder.id },
    // Projetos
    { title: 'Projeto Revitalização Praça Central',                        documentType: 'Projeto',   folderId: projetosFolder.id },
    { title: 'Projeto Iluminação LED — Bairro Norte',                      documentType: 'Projeto',   folderId: projetosFolder.id },
    { title: 'Plano Diretor de Mobilidade Urbana 2026–2030',               documentType: 'Relatório',  folderId: projetosFolder.id },
    // Financeiro
    { title: 'Balancete Financeiro — Junho 2026',                          documentType: 'Relatório',  folderId: financeiroFolder.id },
    { title: 'Empenho 0042/2026 — Manutenção Elétrica',                   documentType: 'Empenho',   folderId: financeiroFolder.id },
    { title: 'Relatório de Execução Orçamentária — 1º Semestre 2026',     documentType: 'Relatório',  folderId: financeiroFolder.id },
    // Jurídica
    { title: 'Parecer Jurídico — Contrato de Concessão de Serviços',       documentType: 'Parecer',   folderId: juridicaFolder.id },
    { title: 'Processo nº 1234567-89.2026 — Ação de Cobrança',             documentType: 'Processo',  folderId: juridicaFolder.id },
  ];

  for (const doc of gedDocs) {
    await upsertDocument(doc.title, {
      documentType: doc.documentType,
      fileUrl: `/uploads/${doc.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 40)}.pdf`,
      folderId: doc.folderId,
    });
  }
  console.log(`✅ ${gedDocs.length} documentos criados nas pastas do GED.`);

  // ─── MODELOS DE DOCUMENTOS ──────────────────────────────────
  const modelos = [
    { title: 'Ofício Padrão',                          notes: 'Modelo oficial para comunicações externas',                  status: 'Ativo' },
    { title: 'Memorando Interno',                      notes: 'Para comunicação entre setores da prefeitura',               status: 'Ativo' },
    { title: 'Portaria de Nomeação',                   notes: 'Uso exclusivo do setor de Recursos Humanos',                 status: 'Ativo' },
    { title: 'Decreto Municipal',                      notes: 'Assinado pelo Prefeito Municipal — Requer revisão jurídica', status: 'Ativo' },
    { title: 'Atestado de Capacidade Técnica',         notes: 'Fornecido a licitantes em processos de contratação',         status: 'Ativo' },
    { title: 'Autorização de Uso de Espaço Público',   notes: 'Para eventos em praças e espaços municipais',                status: 'Inativo' },
  ];

  for (const m of modelos) {
    await upsertDocument(m.title, {
      documentType: 'Modelo',
      fileUrl: `/modelos/${m.title.toLowerCase().replace(/\s+/g, '_')}.docx`,
      status: m.status,
      notes: m.notes,
    });
  }
  console.log(`✅ ${modelos.length} modelos de documentos criados.`);

  // ─── DOCUMENTOS PENDENTES DE ASSINATURA ─────────────────────
  const pendentes = [
    { title: 'Portaria de Nomeação — Maria Souza (Enfermeira)',                documentType: 'Portaria' },
    { title: 'Contrato 015/2026 — Reforma Escola Municipal João XXIII',        documentType: 'Contrato' },
    { title: 'Autorização de Viagem — Congresso Estadual de Prefeitos 2026',   documentType: 'Ofício' },
    { title: 'Decreto 008/2026 — Regulamenta Uso de Tecnologia na Gestão',     documentType: 'Decreto' },
    { title: 'Aditivo Contratual nº 2 — Empresa de TI (Prorrogação 60 dias)',  documentType: 'Aditivo' },
  ];

  for (const doc of pendentes) {
    await upsertDocument(doc.title, {
      documentType: doc.documentType,
      fileUrl: `/docs/${doc.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 40)}.pdf`,
      status: 'Pendente Assinatura',
    });
  }
  console.log(`✅ ${pendentes.length} documentos pendentes de assinatura criados.`);

  console.log('\n🎉 Seed do Módulo 4 concluído!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
