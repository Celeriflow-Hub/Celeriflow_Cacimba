import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Iniciando inserção de dados de teste para o Módulo 3...');

  // Busca entidades necessárias (criadas no seed anterior)
  const person = await prisma.person.findFirst();
  const person2 = await prisma.person.findFirst({ skip: 1 });
  const company = await prisma.company.findFirst();
  const department = await prisma.department.findFirst();
  const employee = await prisma.employee.findFirst();

  if (!person || !department || !employee) {
    throw new Error('Certifique-se de que o seed anterior foi rodado. Faltam Person, Department ou Employee.');
  }

  // Limpar Processos antigos se necessário (opcional, para evitar duplicação)
  // await prisma.process.deleteMany();

  // Criando Diversos Tipos de Processos
  const typeAlvara = await prisma.processType.create({
    data: { name: 'Alvará de Funcionamento', description: 'Solicitação de alvará para estabelecimentos comerciais.' }
  });

  const typeLicenca = await prisma.processType.create({
    data: { name: 'Licença Ambiental', description: 'Emissão de licença ambiental para obras e atividades.' }
  });

  const typeAprovacao = await prisma.processType.create({
    data: { name: 'Aprovação de Projeto', description: 'Aprovação de projetos arquitetônicos.' }
  });

  const typeITBI = await prisma.processType.create({
    data: { name: 'Guia de ITBI', description: 'Emissão de guia para pagamento de ITBI.' }
  });

  // Criando Assuntos
  const subRenovacao = await prisma.subject.create({ data: { name: 'Renovação Anual', processTypeId: typeAlvara.id, slaDays: 15 } });
  const subNovaLicenca = await prisma.subject.create({ data: { name: 'Licença Prévia', processTypeId: typeLicenca.id, slaDays: 30 } });
  const subProjetoResidencial = await prisma.subject.create({ data: { name: 'Residencial Unifamiliar', processTypeId: typeAprovacao.id, slaDays: 20 } });
  const subITBIVenda = await prisma.subject.create({ data: { name: 'Compra e Venda', processTypeId: typeITBI.id, slaDays: 5 } });

  // Processo 1: Em Análise (Alvará)
  const process1 = await prisma.process.create({
    data: {
      protocolNumber: '2026/90001',
      status: 'Em Análise',
      description: 'Solicito a renovação do meu alvará de funcionamento.',
      processTypeId: typeAlvara.id,
      subjectId: subRenovacao.id,
      personId: person.id,
      currentDepartmentId: department.id
    }
  });

  await prisma.processMovement.create({
    data: {
      processId: process1.id,
      fromDepartmentId: department.id,
      toDepartmentId: department.id,
      employeeId: employee.id,
      reason: 'Encaminhado para análise técnica.'
    }
  });

  await prisma.processDispatch.create({
    data: {
      processId: process1.id,
      content: 'A documentação parece estar completa. Aguardando vistoria.',
      dispatchType: 'Parecer',
      employeeId: employee.id,
      departmentId: department.id
    }
  });

  // Processo 2: Aberto (ITBI)
  await prisma.process.create({
    data: {
      protocolNumber: '2026/90002',
      status: 'Aberto',
      description: 'Solicitação de ITBI referente ao imóvel matrícula 12345.',
      processTypeId: typeITBI.id,
      subjectId: subITBIVenda.id,
      personId: person2?.id || person.id,
      currentDepartmentId: department.id
    }
  });

  // Processo 3: Concluído (Aprovação de Projeto)
  const process3 = await prisma.process.create({
    data: {
      protocolNumber: '2026/90003',
      status: 'Concluído',
      description: 'Projeto de construção de residência unifamiliar no bairro Centro.',
      processTypeId: typeAprovacao.id,
      subjectId: subProjetoResidencial.id,
      companyId: company?.id,
      currentDepartmentId: department.id
    }
  });

  await prisma.processDispatch.create({
    data: {
      processId: process3.id,
      content: 'Projeto analisado e aprovado conforme diretrizes municipais. Alvará de construção emitido.',
      dispatchType: 'Decisão',
      employeeId: employee.id,
      departmentId: department.id
    }
  });

  // Processo 4: Arquivado (Licença Ambiental)
  await prisma.process.create({
    data: {
      protocolNumber: '2026/90004',
      status: 'Arquivado',
      description: 'Solicitação de licença prévia para loteamento.',
      processTypeId: typeLicenca.id,
      subjectId: subNovaLicenca.id,
      companyId: company?.id,
      currentDepartmentId: department.id
    }
  });

  // Processo 5: Em Análise (ITBI)
  await prisma.process.create({
    data: {
      protocolNumber: '2026/90005',
      status: 'Em Análise',
      description: 'Emissão de ITBI urgente.',
      processTypeId: typeITBI.id,
      subjectId: subITBIVenda.id,
      personId: person.id,
      currentDepartmentId: department.id,
      priority: 'Urgente'
    }
  });

  console.log('Inserção de dados do Módulo 3 concluída com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
