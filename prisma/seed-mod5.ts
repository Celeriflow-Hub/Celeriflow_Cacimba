import 'dotenv/config';
import type { Prisma } from '@prisma/client';
import { prisma } from '../src/lib/prisma';

async function upsertChannel(name: string, description: string) {
  const existing = await prisma.supportChannel.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.supportChannel.create({ data: { name, description } });
}

async function upsertPerson(cpf: string, fullName: string) {
  const existing = await prisma.person.findFirst({ where: { cpf } });
  if (existing) return existing;
  return prisma.person.create({ data: { cpf, fullName, status: 'Ativo' } });
}

async function upsertTicket(ticketNumber: string, data: Omit<Prisma.TicketUncheckedCreateInput, "ticketNumber">) {
  const existing = await prisma.ticket.findUnique({ where: { ticketNumber } });
  if (existing) return existing;
  return prisma.ticket.create({ data: { ticketNumber, ...data } });
}

async function upsertOmbudsman(protocolNumber: string, data: Omit<Prisma.OmbudsmanUncheckedCreateInput, "protocolNumber">) {
  const existing = await prisma.ombudsman.findUnique({ where: { protocolNumber } });
  if (existing) return existing;
  return prisma.ombudsman.create({ data: { protocolNumber, ...data } });
}

async function main() {
  console.log('\n🚀 Iniciando seed do Módulo 5 (Atendimento)...\n');

  // ─── CANAIS DE ATENDIMENTO ─────────────────────────────────────
  const portalChannel = await upsertChannel('Portal do Cidadão', 'Atendimento via plataforma online');
  const telChannel = await upsertChannel('Telefone 156', 'Central de atendimento telefônico');
  const balcaoChannel = await upsertChannel('Balcão Presencial', 'Atendimento na prefeitura');
  console.log('✅ Canais criados.');

  // ─── CIDADÃOS MOCK ─────────────────────────────────────────────
  const person1 = await upsertPerson('11122233344', 'Carlos Mendes da Silva');
  const person2 = await upsertPerson('55566677788', 'Ana Lúcia Ferreira');
  console.log('✅ Cidadãos criados.');

  // ─── TICKETS (CHAMADOS) ────────────────────────────────────────
  const tickets = [
    {
      ticketNumber: 'TKT-2026-8492',
      subject: 'Lâmpada Queimada na Praça da Matriz',
      description: 'A lâmpada do poste em frente ao coreto está queimada há 3 dias. Local bem escuro.',
      priority: 'Normal',
      status: 'Aberto',
      channelId: portalChannel.id,
      personId: person1.id
    },
    {
      ticketNumber: 'TKT-2026-1934',
      subject: 'Vazamento de água na calçada',
      description: 'Cano estourado vazando água limpa na rua principal.',
      priority: 'Alta',
      status: 'Em Atendimento',
      channelId: telChannel.id,
      personId: person2.id
    },
    {
      ticketNumber: 'TKT-2026-5531',
      subject: 'Poda de árvore com risco de queda',
      description: 'Árvore antiga caindo galhos secos próximo à fiação elétrica.',
      priority: 'Urgente',
      status: 'Aberto',
      channelId: balcaoChannel.id,
      personId: person1.id
    }
  ];

  for (const t of tickets) {
    await upsertTicket(t.ticketNumber, t);
  }
  console.log(`✅ ${tickets.length} chamados criados.`);

  // ─── OUVIDORIA (DENÚNCIAS/MANIFESTAÇÕES) ────────────────────────
  const ombudsmanCases = [
    {
      protocolNumber: 'OUV-2026-901',
      type: 'Denúncia',
      subject: 'Terreno baldio com foco de dengue',
      description: 'O terreno na esquina da Rua X está com mato alto, muito lixo acumulado e água parada. Solicito fiscalização imediata.',
      isAnonymous: true,
      isConfidential: true,
      status: 'Recebida',
      channelId: portalChannel.id,
      personId: null
    },
    {
      protocolNumber: 'OUV-2026-902',
      type: 'Reclamação',
      subject: 'Atraso na coleta de lixo',
      description: 'O caminhão de lixo não passou esta semana no Bairro das Flores. Os lixos estão acumulando nas calçadas.',
      isAnonymous: false,
      isConfidential: false,
      status: 'Em Análise',
      channelId: telChannel.id,
      personId: person2.id
    },
    {
      protocolNumber: 'OUV-2026-903',
      type: 'Elogio',
      subject: 'Atendimento Posto de Saúde',
      description: 'Gostaria de elogiar a equipe do postinho central, em especial as enfermeiras, pelo ótimo acolhimento.',
      isAnonymous: false,
      isConfidential: false,
      status: 'Concluída',
      channelId: portalChannel.id,
      personId: person1.id
    }
  ];

  for (const o of ombudsmanCases) {
    await upsertOmbudsman(o.protocolNumber, o);
  }
  console.log(`✅ ${ombudsmanCases.length} manifestações de ouvidoria criadas.`);

  console.log('\n🎉 Seed do Módulo 5 concluído!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
