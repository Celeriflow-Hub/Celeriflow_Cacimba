import { config } from 'dotenv'
config({ path: '.env.local' })
config()
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('Iniciando seed do Módulo 9 (Compras e Contratos)...')

  // Limpeza de tabelas para gerar dados limpos e sem 404
  await prisma.purchaseRequestItem.deleteMany()
  await prisma.purchaseProcessItem.deleteMany()
  await prisma.contract.deleteMany()
  await prisma.bidding.deleteMany()
  await prisma.directContracting.deleteMany()
  await prisma.purchaseProcess.deleteMany()
  await prisma.purchaseRequest.deleteMany()
  await prisma.catalogItem.deleteMany()

  // 1. Garantir que existam registros básicos (Secretaria, Departamento, Funcionario, Fornecedor)
  let secretariat = await prisma.secretariat.findFirst({ where: { acronym: 'SEMAD' } })
  if (!secretariat) {
    secretariat = await prisma.secretariat.create({
      data: { name: 'Secretaria de Administração', acronym: 'SEMAD', isActive: true }
    })
  }

  let department = await prisma.department.findFirst({ where: { name: 'Departamento de Compras' } })
  if (!department) {
    department = await prisma.department.create({
      data: { name: 'Departamento de Compras', secretariatId: secretariat.id, isActive: true }
    })
  }

  let employee = await prisma.employee.findFirst({ where: { name: 'João Comprador' } })
  if (!employee) {
    employee = await prisma.employee.create({
      data: { name: 'João Comprador', isActive: true, secretariatId: secretariat.id, departmentId: department.id }
    })
  }

  let company = await prisma.company.findFirst({ where: { cnpj: '12345678000199' } })
  if (!company) {
    company = await prisma.company.create({
      data: { corporateName: 'Fornecedor Exemplo LTDA', cnpj: '12345678000199', status: 'Ativo' }
    })
  }

  let supplier = await prisma.supplier.findFirst({ where: { companyId: company.id } })
  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: { status: 'Ativo', companyId: company.id }
    })
  }

  // 2. Inserir 3 Itens de Catálogo
  const cat1 = await prisma.catalogItem.create({
    data: { code: 'CAT-0001', name: 'Papel Sulfite A4', description: 'Caixa com 10 resmas', unit: 'CX', estimatedValue: 250.00 }
  })
  const cat2 = await prisma.catalogItem.create({
    data: { code: 'CAT-0002', name: 'Caneta Esferográfica Azul', description: 'Caixa com 50 unidades', unit: 'CX', estimatedValue: 35.50 }
  })
  const cat3 = await prisma.catalogItem.create({
    data: { code: 'CAT-0003', name: 'Computador Desktop Core i5', description: '8GB RAM, 256GB SSD', unit: 'UN', estimatedValue: 3500.00 }
  })

  console.log(`✅ Itens de Catálogo inseridos.`)

  // 3. Inserir 3 Solicitações de Compra
  await prisma.purchaseRequest.create({
    data: { 
      number: 'REQ-2026-001', object: 'Aquisição de material de expediente', justification: 'Reposição de estoque', estimatedValue: 321.00, status: 'Aprovada', secretariatId: secretariat.id, departmentId: department.id, requesterId: employee.id,
      items: {
        create: [
          { catalogItemId: cat1.id, quantity: 1, estimatedUnitValue: 250.00 },
          { catalogItemId: cat2.id, quantity: 2, estimatedUnitValue: 35.50 }
        ]
      }
    }
  })

  await prisma.purchaseRequest.create({
    data: { 
      number: 'REQ-2026-002', object: 'Aquisição de computadores para o setor', justification: 'Atualização do parque tecnológico', estimatedValue: 10500.00, status: 'Enviada', secretariatId: secretariat.id, departmentId: department.id, requesterId: employee.id,
      items: {
        create: [
          { catalogItemId: cat3.id, quantity: 3, estimatedUnitValue: 3500.00 }
        ]
      }
    }
  })

  await prisma.purchaseRequest.create({
    data: { 
      number: 'REQ-2026-003', object: 'Contratação de serviço de limpeza', justification: 'Manutenção predial', estimatedValue: 5000.00, status: 'Rascunho', secretariatId: secretariat.id, departmentId: department.id, requesterId: employee.id,
      items: {
        create: [
          { customName: 'Serviço de limpeza mensal', quantity: 1, estimatedUnitValue: 5000.00 }
        ]
      }
    }
  })

  console.log(`✅ Solicitações inseridas com seus itens.`)

  // 4. Inserir 3 Processos de Compra
  const proc1 = await prisma.purchaseProcess.create({
    data: { 
      number: 'PROC-2026-101', object: 'Aquisição de material de expediente', type: 'Comum', modality: 'Pregão Eletrônico', estimatedValue: 15000.00, status: 'Em Licitação', secretariatId: secretariat.id,
      items: {
        create: [
          { catalogItemId: cat1.id, quantity: 50, estimatedUnitValue: 250.00 },
          { catalogItemId: cat2.id, quantity: 70, estimatedUnitValue: 35.50 }
        ]
      }
    }
  })

  const proc2 = await prisma.purchaseProcess.create({
    data: { 
      number: 'PROC-2026-102', object: 'Aquisição de equipamentos de TI', type: 'Registro de Preços', modality: 'Pregão Eletrônico', estimatedValue: 55000.00, status: 'Concluído', secretariatId: secretariat.id,
      items: {
        create: [
          { catalogItemId: cat3.id, quantity: 15, estimatedUnitValue: 3500.00 }
        ]
      }
    }
  })

  const proc3 = await prisma.purchaseProcess.create({
    data: { 
      number: 'PROC-2026-103', object: 'Serviço de manutenção de ar condicionado', type: 'Comum', modality: 'Dispensa', estimatedValue: 8000.00, status: 'Em Planejamento', secretariatId: secretariat.id,
      items: {
        create: [
          { customName: 'Manutenção preventiva e corretiva', quantity: 1, estimatedUnitValue: 8000.00 }
        ]
      }
    }
  })

  console.log(`✅ Processos inseridos.`)

  // 5. Inserir 3 Licitações
  await prisma.bidding.create({
    data: { number: 'PE-001/2026', modality: 'Pregão Eletrônico', status: 'Aberto', processId: proc1.id, sessionDate: new Date('2026-08-15T09:00:00Z') }
  })
  
  await prisma.bidding.create({
    data: { number: 'PE-002/2026', modality: 'Pregão Eletrônico', status: 'Homologado', processId: proc2.id, sessionDate: new Date('2026-07-01T09:00:00Z') }
  })
  
  await prisma.directContracting.create({
    data: { type: 'Dispensa', justification: 'Valor inferior ao limite', value: 8000.00, status: 'Em Elaboração', processId: proc3.id, supplierId: supplier.id }
  })
  
  console.log(`✅ Licitações e Dispensas inseridas.`)

  // 6. Inserir 3 Contratos
  await prisma.contract.create({
    data: { number: 'CONT-001/2026', object: 'Fornecimento de computadores', initialValue: 55000.00, updatedValue: 55000.00, startDate: new Date('2026-07-10T00:00:00Z'), endDate: new Date('2027-07-10T00:00:00Z'), status: 'Vigente', processId: proc2.id, supplierId: supplier.id, secretariatId: secretariat.id, managerId: employee.id }
  })

  await prisma.contract.create({
    data: { number: 'CONT-002/2026', object: 'Serviço de limpeza contínua', initialValue: 120000.00, updatedValue: 120000.00, startDate: new Date('2026-01-01T00:00:00Z'), endDate: new Date('2026-12-31T00:00:00Z'), status: 'Vigente', processId: proc1.id, supplierId: supplier.id, secretariatId: secretariat.id, managerId: employee.id }
  })

  await prisma.contract.create({
    data: { number: 'CONT-003/2025', object: 'Fornecimento de papel', initialValue: 30000.00, updatedValue: 30000.00, startDate: new Date('2025-06-01T00:00:00Z'), endDate: new Date('2026-06-01T00:00:00Z'), status: 'Encerrado', processId: proc1.id, supplierId: supplier.id, secretariatId: secretariat.id, managerId: employee.id }
  })

  console.log(`✅ Contratos inseridos.`)

  console.log('🎉 Seed do Módulo 9 concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
