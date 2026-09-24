import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('Iniciando seed completo de Almoxarifado, Patrimônio, Centros de Custo e Requisições...')

  // 1. Secretarias e Departamentos
  const secAdmin = await prisma.secretariat.findFirst({ where: { name: { contains: 'Administração' } } }) || 
    await prisma.secretariat.create({ data: { name: 'Secretaria Municipal de Administração', acronym: 'SMA' } })

  const secSaude = await prisma.secretariat.findFirst({ where: { name: { contains: 'Saúde' } } }) ||
    await prisma.secretariat.create({ data: { name: 'Secretaria Municipal de Saúde', acronym: 'SMS' } })

  const secEducacao = await prisma.secretariat.findFirst({ where: { name: { contains: 'Educação' } } }) ||
    await prisma.secretariat.create({ data: { name: 'Secretaria Municipal de Educação', acronym: 'SME' } })

  const secObras = await prisma.secretariat.findFirst({ where: { name: { contains: 'Obras' } } }) ||
    await prisma.secretariat.create({ data: { name: 'Secretaria Municipal de Obras e Infraestrutura', acronym: 'SMOI' } })

  const deptAdmin = await prisma.department.findFirst({ where: { secretariatId: secAdmin.id } }) ||
    await prisma.department.create({ data: { name: 'Departamento de Gestão de Materiais e Patrimônio', secretariatId: secAdmin.id } })

  const deptSaude = await prisma.department.findFirst({ where: { secretariatId: secSaude.id } }) ||
    await prisma.department.create({ data: { name: 'Departamento de Gestão Hospitalar e Insumos', secretariatId: secSaude.id } })

  const deptEducacao = await prisma.department.findFirst({ where: { secretariatId: secEducacao.id } }) ||
    await prisma.department.create({ data: { name: 'Departamento de Alimentação Escolar e Ensino', secretariatId: secEducacao.id } })

  const deptObras = await prisma.department.findFirst({ where: { secretariatId: secObras.id } }) ||
    await prisma.department.create({ data: { name: 'Departamento de Manutenção da Infraestrutura Urbana', secretariatId: secObras.id } })

  // Cargo Almoxarife
  const roleAlmoxarife = await prisma.role.findFirst({ where: { name: 'Almoxarife' } }) ||
    await prisma.role.create({ data: { name: 'Almoxarife' } })

  // 2. Servidores Responsáveis (Almoxarifes)
  const almoxarife1 = await prisma.employee.upsert({
    where: { cpf: '11122233344' },
    update: { roleId: roleAlmoxarife.id },
    create: { name: 'Carlos Alberto Silva', cpf: '11122233344', roleId: roleAlmoxarife.id }
  })

  const almoxarife2 = await prisma.employee.upsert({
    where: { cpf: '22233344455' },
    update: { roleId: roleAlmoxarife.id },
    create: { name: 'Mariana Oliveira Souza', cpf: '22233344455', roleId: roleAlmoxarife.id }
  })

  const almoxarife3 = await prisma.employee.upsert({
    where: { cpf: '33344455566' },
    update: { roleId: roleAlmoxarife.id },
    create: { name: 'Roberto Santos Ferreira', cpf: '33344455566', roleId: roleAlmoxarife.id }
  })

  const almoxarife4 = await prisma.employee.upsert({
    where: { cpf: '44455566677' },
    update: { roleId: roleAlmoxarife.id },
    create: { name: 'Fernanda Souza Lima', cpf: '44455566677', roleId: roleAlmoxarife.id }
  })

  // 3. Centros de Custo (10 Mínimo com lógica municipal)
  const costCentersData = [
    { code: 'CC-001', name: 'Secretaria Municipal de Educação', description: 'Atividades administrativas e operacionais do ensino público municipal' },
    { code: 'CC-002', name: 'Secretaria Municipal de Saúde', description: 'Manutenção de postos de saúde, UPAs, hospitais e programas de vacinação' },
    { code: 'CC-003', name: 'Secretaria Municipal de Obras e Infraestrutura', description: 'Obras públicas, manutenção viária, edificações e serviços urbanos' },
    { code: 'CC-004', name: 'Secretaria Municipal de Administração e Planejamento', description: 'Gestão de pessoas, compras, patrimônio, protocolo e TI central' },
    { code: 'CC-005', name: 'Secretaria Municipal de Assistência Social', description: 'Centros de referência (CRAS/CREAS), abrigos e auxílios sociais' },
    { code: 'CC-006', name: 'Secretaria Municipal de Segurança e Mobilidade Urbana', description: 'Guarda municipal, trânsito, sinalização e fiscalização urbana' },
    { code: 'CC-007', name: 'Secretaria Municipal de Meio Ambiente e Limpeza Urbana', description: 'Parques, jardins, coleta seletiva, arborização e preservação' },
    { code: 'CC-008', name: 'Secretaria Municipal de Fazenda e Finanças', description: 'Arrecadação tributária, contabilidade, tesouraria e orçamento' },
    { code: 'CC-009', name: 'Secretaria Municipal de Transportes e Frotas', description: 'Manutenção de frotas oficiais, frota de maquinários e transporte' },
    { code: 'CC-010', name: 'Secretaria Municipal de Cultura, Esporte e Lazer', description: 'Equipamentos culturais, centro de memória, quadras e incentivos' }
  ]

  const createdCostCenters: Record<string, any> = {}
  for (const cc of costCentersData) {
    const item = await prisma.costCenter.upsert({
      where: { code: cc.code },
      update: { name: cc.name, description: cc.description, isActive: true },
      create: { code: cc.code, name: cc.name, description: cc.description, isActive: true }
    })
    createdCostCenters[cc.code] = item
  }

  // 4. Almoxarifados com endereços em Belo Horizonte, MG
  const warehousesData = [
    {
      name: 'Almoxarifado Central',
      type: 'Central',
      streetName: 'Av. Afonso Pena',
      number: '1212',
      neighborhood: 'Centro',
      city: 'Belo Horizonte',
      state: 'MG',
      zipCode: '30130-003',
      address: 'Av. Afonso Pena, 1212 - Centro, Belo Horizonte - MG, 30130-003',
      managerId: almoxarife1.id,
      costCenterId: createdCostCenters['CC-004'].id
    },
    {
      name: 'Almoxarifado da Saúde',
      type: 'Setorial',
      streetName: 'Av. Alfredo Balena',
      number: '190',
      neighborhood: 'Santa Efigênia',
      city: 'Belo Horizonte',
      state: 'MG',
      zipCode: '30130-100',
      address: 'Av. Alfredo Balena, 190 - Santa Efigênia, Belo Horizonte - MG, 30130-100',
      managerId: almoxarife2.id,
      costCenterId: createdCostCenters['CC-002'].id
    },
    {
      name: 'Almoxarifado da Educação',
      type: 'Setorial',
      streetName: 'Rua da Bahia',
      number: '1400',
      neighborhood: 'Lourdes',
      city: 'Belo Horizonte',
      state: 'MG',
      zipCode: '30160-011',
      address: 'Rua da Bahia, 1400 - Lourdes, Belo Horizonte - MG, 30160-011',
      managerId: almoxarife3.id,
      costCenterId: createdCostCenters['CC-001'].id
    },
    {
      name: 'Almoxarifado de Obras e Manutenção',
      type: 'Setorial',
      streetName: 'Av. Amazonas',
      number: '5500',
      neighborhood: 'Nova Suíssa',
      city: 'Belo Horizonte',
      state: 'MG',
      zipCode: '30421-169',
      address: 'Av. Amazonas, 5500 - Nova Suíssa, Belo Horizonte - MG, 30421-169',
      managerId: almoxarife4.id,
      costCenterId: createdCostCenters['CC-003'].id
    }
  ]

  const warehouses: any[] = []
  for (const wh of warehousesData) {
    const existing = await prisma.warehouse.findFirst({ where: { name: wh.name } })
    if (existing) {
      const updated = await prisma.warehouse.update({
        where: { id: existing.id },
        data: wh
      })
      warehouses.push(updated)
    } else {
      const created = await prisma.warehouse.create({ data: wh })
      warehouses.push(created)
    }
  }

  // 5. Categorias de Materiais
  const materialCategoriesData = [
    { code: 'CAT-EXP', name: 'Material de Expediente e Escritório' },
    { code: 'CAT-LMP', name: 'Material de Limpeza e Higiene' },
    { code: 'CAT-MED', name: 'Medicamentos e Insumos Hospitalares' },
    { code: 'CAT-ALPER', name: 'Alimentação Escolar - Gêneros Perecíveis' },
    { code: 'CAT-ALNPER', name: 'Alimentação Escolar - Gêneros Não Perecíveis' },
    { code: 'CAT-MAN', name: 'Material de Manutenção, Ferramentas e Obras' },
    { code: 'CAT-ELE', name: 'Peças e Insumos Elétricos e Eletrônicos' },
    { code: 'CAT-DID', name: 'Material Escolar, Didático e Pedagógico' }
  ]

  const matCats: Record<string, any> = {}
  for (const mc of materialCategoriesData) {
    const item = await prisma.materialCategory.upsert({
      where: { code: mc.code },
      update: { name: mc.name },
      create: { code: mc.code, name: mc.name }
    })
    matCats[mc.code] = item
  }

  // 6. Fornecedor Padrão
  const supplier = await prisma.supplier.findFirst() || 
    await prisma.supplier.create({
      data: {
        category: 'Comércio Geral',
        businessBranch: 'Fornecimento para Gestão Pública',
        status: 'Ativo',
        company: {
          create: {
            corporateName: 'Distribuidora Global de Insumos LTDA',
            tradeName: 'Distribuidora Global',
            cnpj: '98765432000188',
            companyType: 'ME',
            primaryCnae: '46.49-4-99'
          }
        }
      }
    })

  // 7. População Massiva de MATERIAIS (>1.000 materiais diversos)
  console.log('Gerando +1.000 materiais de consumo e distribuições de estoque...')
  
  const prefixes = [
    { catKey: 'CAT-EXP', namePrefix: 'Papel A4 Reciclado 75g/m2 500fls', unit: 'CX', min: 100, cost: 28.50, perishable: false, desc: 'Caixa com 10 pacotes de papel A4 reciclado para impressão oficial em secretarias.' },
    { catKey: 'CAT-EXP', namePrefix: 'Caneta Esferográfica Azul 1.0mm', unit: 'CX', min: 50, cost: 35.00, perishable: false, desc: 'Caixa de canetas esferográficas corpo transparente carga azul longa duração.' },
    { catKey: 'CAT-EXP', namePrefix: 'Grampo para Grampeador 26/6 Galvanizado', unit: 'CX', min: 40, cost: 8.90, perishable: false, desc: 'Caixa com 5.000 grampos galvanizados para pastas e documentos.' },
    { catKey: 'CAT-EXP', namePrefix: 'Pasta Suspensa Marrom com Grampo Plastificado', unit: 'CX', min: 30, cost: 85.00, perishable: false, desc: 'Caixa com 50 pastas suspensas para arquivo deslizante da prefeitura.' },
    { catKey: 'CAT-EXP', namePrefix: 'Bloco Adesivo Recado Amarelo 76x76mm', unit: 'UN', min: 80, cost: 4.50, perishable: false, desc: 'Bloco de notas autoadesivas resecáveis cor amarela para recados de protocolo.' },
    
    { catKey: 'CAT-LMP', namePrefix: 'Sabão Líquido Neutro para Mãos 5 Litros', unit: 'LT', min: 60, cost: 32.00, perishable: false, desc: 'Galão 5L de sabonete líquido neutro suave com glicerina para sanitários públicos.' },
    { catKey: 'CAT-LMP', namePrefix: 'Desinfetante Hospitalar Clorado 5 Litros', unit: 'LT', min: 80, cost: 45.00, perishable: false, desc: 'Galão 5L desinfetante clorado concentrado para desinfecção de hospitais e UPAs.' },
    { catKey: 'CAT-LMP', namePrefix: 'Papel Toalha Interfolhado Folha Dupla', unit: 'CX', min: 120, cost: 58.00, perishable: false, desc: 'Fardo/Caixa de papel toalha 100% celulose pura 20x21cm.' },
    { catKey: 'CAT-LMP', namePrefix: 'Saco para Lixo Hospitalar Infectante 100L', unit: 'PCT', min: 150, cost: 42.00, perishable: false, desc: 'Pacote com 100 sacos brancos infectantes simbologia risco biológico 100 litros.' },
    { catKey: 'CAT-LMP', namePrefix: 'Água Sanitária Concentrada 2,5%', unit: 'CX', min: 90, cost: 29.90, perishable: false, desc: 'Caixa com 12 frascos de 1L água sanitária higienizadora.' },

    { catKey: 'CAT-MED', namePrefix: 'Paracetamol 500mg Comprimido Blíster', unit: 'CX', min: 200, cost: 18.00, perishable: true, desc: 'Caixa com 500 comprimidos paracetamol 500mg analgésico e antitérmico básico.' },
    { catKey: 'CAT-MED', namePrefix: 'Amoxicilina 500mg Cápsula', unit: 'CX', min: 150, cost: 45.00, perishable: true, desc: 'Caixa com 300 cápsulas antibiótico amoxicilina 500mg dispensação farmácia municipal.' },
    { catKey: 'CAT-MED', namePrefix: 'Dipirona Sódica 500mg/ml Gota 20ml', unit: 'CX', min: 180, cost: 38.00, perishable: true, desc: 'Caixa com 50 frascos de gotas dipirona sódica antitérmica.' },
    { catKey: 'CAT-MED', namePrefix: 'Gaze Estéril 11 Fios 7.5x7.5cm', unit: 'PCT', min: 500, cost: 12.50, perishable: false, desc: 'Pacote estéril com 10 unidades de compressas de gaze para curativos.' },
    { catKey: 'CAT-MED', namePrefix: 'Seringa Descartável 5ml com Agulha 25x7', unit: 'CX', min: 300, cost: 65.00, perishable: false, desc: 'Caixa com 100 seringas descartáveis 5ml bico luer lock estéril.' },
    { catKey: 'CAT-MED', namePrefix: 'Álcool Etílico 70% Hospitalar 1 Litro', unit: 'CX', min: 200, cost: 72.00, perishable: false, desc: 'Caixa com 12 frascos de 1L álcool 70% desinfecção de superfícies e pele.' },

    { catKey: 'CAT-ALPER', namePrefix: 'Leite Integral Pasteurizado Saco 1 Litro', unit: 'LT', min: 300, cost: 4.80, perishable: true, desc: 'Leite tipo C pasteurizado para consumo em creches e escolas municipais.' },
    { catKey: 'CAT-ALPER', namePrefix: 'Maçã Fuji Fresca Categoria 1', unit: 'KG', min: 200, cost: 8.50, perishable: true, desc: 'Maçã fuji selecionada de produtores rurais para merenda escolar.' },
    { catKey: 'CAT-ALPER', namePrefix: 'Carne Moída Patinho Congelado 1kg', unit: 'KG', min: 150, cost: 34.00, perishable: true, desc: 'Carne bovina moída de 1ª qualidade congelada pacote de 1kg inspecionado.' },
    { catKey: 'CAT-ALPER', namePrefix: 'Peito de Frango Sem Osso Congelado', unit: 'KG', min: 180, cost: 21.00, perishable: true, desc: 'Peito de frango congelado IQF pacote 1kg para refeições de alunos.' },

    { catKey: 'CAT-ALNPER', namePrefix: 'Arroz Branco Tipo 1 Pacote 5kg', unit: 'PCT', min: 400, cost: 26.90, perishable: true, desc: 'Fardo/Pacote arroz tipo 1 beneficiado polido 5kg.' },
    { catKey: 'CAT-ALNPER', namePrefix: 'Feijão Carioquinha Novo Pacote 1kg', unit: 'PCT', min: 350, cost: 7.80, perishable: true, desc: 'Feijão carioquinha grão novo tipo 1 pacote de 1kg.' },
    { catKey: 'CAT-ALNPER', namePrefix: 'Macarrão Espaguete com Ovos 500g', unit: 'PCT', min: 500, cost: 4.20, perishable: true, desc: 'Macarrão de sêmola com ovos tipo espaguete nº 8 pacote 500g.' },
    { catKey: 'CAT-ALNPER', namePrefix: 'Óleo de Soja Refinado 900ml', unit: 'CX', min: 250, cost: 78.00, perishable: true, desc: 'Caixa com 20 garrafas de 900ml óleo de soja refinado.' },

    { catKey: 'CAT-MAN', namePrefix: 'Lâmpada LED Tubular T8 18W 6500K 120cm', unit: 'CX', min: 100, cost: 140.00, perishable: false, desc: 'Caixa com 10 lâmpadas tubulares LED luz branca fria iluminação de salas.' },
    { catKey: 'CAT-MAN', namePrefix: 'Cabo Flexível 2.5mm 750V Rolo 100m Azul', unit: 'ROLO', min: 40, cost: 165.00, perishable: false, desc: 'Rolo de 100m cabo de cobre flexível anti-chama para instalações elétricas.' },
    { catKey: 'CAT-MAN', namePrefix: 'Tinta Acrílica Premium Branca Fosca 18 Litros', unit: 'GAL', min: 30, cost: 240.00, perishable: false, desc: 'Lata de 18L tinta acrílica lavável alta cobertura pintura de prédios públicos.' },
    { catKey: 'CAT-MAN', namePrefix: 'Disjuntor Termomagnético Bipolar 32A DIN', unit: 'UN', min: 60, cost: 28.00, perishable: false, desc: 'Disjuntor padrão DIN para quadros de distribuição elétrica.' },

    { catKey: 'CAT-ELE', namePrefix: 'Tomada Dupla 2P+T 10A com Espelho 4x2', unit: 'UN', min: 100, cost: 14.50, perishable: false, desc: 'Conjunto tomada dupla embutir 10A com espelho padrão brasileiro.' },
    { catKey: 'CAT-ELE', namePrefix: 'Fita Isolante de Auto-Fusão 19mmx10m', unit: 'UN', min: 150, cost: 19.00, perishable: false, desc: 'Fita isolante em borracha etileno-propileno para alta isolação e vedação.' },

    { catKey: 'CAT-DID', namePrefix: 'Caderno Brochurão 96 Folhas Capa Dura', unit: 'UN', min: 600, cost: 6.50, perishable: false, desc: 'Caderno escolar brochura grande 96 folhas pautadas capa dura colorida.' },
    { catKey: 'CAT-DID', namePrefix: 'Caixa de Lápis de Cor 12 Cores Sextavado', unit: 'CX', min: 400, cost: 9.90, perishable: false, desc: 'Caixa de lápis de cor madeira reflorestada macio 12 cores.' },
    { catKey: 'CAT-DID', namePrefix: 'Tinta Guache Kit 6 Cores 250ml Cada', unit: 'KIT', min: 200, cost: 24.00, perishable: false, desc: 'Kit de tintas escolares guache lavável 6 potes de 250ml.' }
  ]

  // Generate 1020 total unique materials
  const totalMaterialsToCreate = 1020
  const generatedMaterials: any[] = []

  let index = 1
  while (generatedMaterials.length < totalMaterialsToCreate) {
    const base = prefixes[(index - 1) % prefixes.length]
    const codeNumber = String(index).padStart(5, '0')
    const code = `MAT${codeNumber}`
    const category = matCats[base.catKey]
    const variantNum = Math.floor((index - 1) / prefixes.length) + 1
    const name = variantNum === 1 ? base.namePrefix : `${base.namePrefix} - Ref/Var ${variantNum}`
    const minStock = base.min + (variantNum * 2)

    generatedMaterials.push({
      code,
      name,
      description: base.desc,
      type: 'MATERIAL',
      unitOfMeasure: base.unit,
      minStock,
      maxStock: minStock * 5,
      isPerishable: base.perishable,
      categoryId: category.id,
      unitCost: base.cost + (variantNum * 0.5)
    })
    index++
  }

  console.log(`Persistindo ${generatedMaterials.length} materiais e posições de estoque...`)
  
  for (let i = 0; i < generatedMaterials.length; i += 100) {
    const batch = generatedMaterials.slice(i, i + 100)
    for (const item of batch) {
      const createdMat = await prisma.material.upsert({
        where: { code: item.code },
        update: {
          name: item.name,
          description: item.description,
          type: item.type,
          unitOfMeasure: item.unitOfMeasure,
          minStock: item.minStock,
          maxStock: item.maxStock,
          isPerishable: item.isPerishable,
          categoryId: item.categoryId
        },
        create: {
          code: item.code,
          name: item.name,
          description: item.description,
          type: item.type,
          unitOfMeasure: item.unitOfMeasure,
          minStock: item.minStock,
          maxStock: item.maxStock,
          isPerishable: item.isPerishable,
          categoryId: item.categoryId
        }
      })

      // Target warehouse assignment based on category
      let assignedWh = warehouses[0]
      if (item.categoryId === matCats['CAT-MED'].id || item.categoryId === matCats['CAT-LMP'].id) {
        assignedWh = warehouses[1] // Almoxarifado da Saúde
      } else if (item.categoryId === matCats['CAT-ALPER'].id || item.categoryId === matCats['CAT-ALNPER'].id || item.categoryId === matCats['CAT-DID'].id) {
        assignedWh = warehouses[2] // Almoxarifado da Educação
      } else if (item.categoryId === matCats['CAT-MAN'].id || item.categoryId === matCats['CAT-ELE'].id) {
        assignedWh = warehouses[3] // Almoxarifado de Obras
      }

      // Quantity variation logic:
      // Item index % 3 -> 0: Red (< minStock), 1: Yellow (close to minStock), 2: Green (> minStock)
      let quantity = 0
      const mod = (i + generatedMaterials.indexOf(item)) % 3
      if (mod === 0) {
        quantity = Math.max(2, Math.floor(item.minStock * 0.4)) // RED
      } else if (mod === 1) {
        quantity = Math.floor(item.minStock * 1.1) // YELLOW (within 20% above minStock)
      } else {
        quantity = Math.floor(item.minStock * 2.8) // GREEN
      }

      const expDate = item.isPerishable ? new Date('2026-12-15') : null

      await prisma.materialStock.upsert({
        where: {
          warehouseId_materialId_batchNumber: {
            warehouseId: assignedWh.id,
            materialId: createdMat.id,
            batchNumber: 'LOTE-2026-01'
          }
        },
        update: {
          quantity,
          unitCost: item.unitCost,
          expirationDate: expDate
        },
        create: {
          warehouseId: assignedWh.id,
          materialId: createdMat.id,
          batchNumber: 'LOTE-2026-01',
          quantity,
          unitCost: item.unitCost,
          expirationDate: expDate
        }
      })
    }
  }

  // 8. População de EQUIPAMENTOS E BENS PATRIMONIAIS (>300 itens na tabela Asset)
  console.log('Gerando +300 Equipamentos e Bens Patrimoniais...')

  const assetCategoriesData = [
    { code: 'CAT-INFO', name: 'Equipamentos de Informática e Comunicação', lifeSpan: 5 },
    { code: 'CAT-MOV', name: 'Móveis, Máquinas e Utensílios de Escritório', lifeSpan: 10 },
    { code: 'CAT-VEIC', name: 'Veículos Automotores e Transporte', lifeSpan: 8 },
    { code: 'CAT-FERR', name: 'Máquinas Industriais, Ferramentas e Oficina', lifeSpan: 10 },
    { code: 'CAT-MEDEQUIP', name: 'Equipamentos Médico-Hospitalares e Laboratório', lifeSpan: 8 },
    { code: 'CAT-CLIM', name: 'Climatização, Eletrodomésticos e Som', lifeSpan: 7 }
  ]

  const assetCats: Record<string, any> = {}
  for (const ac of assetCategoriesData) {
    const item = await prisma.assetCategory.findFirst({ where: { code: ac.code } }) ||
      await prisma.assetCategory.create({ data: { code: ac.code, name: ac.name, lifeSpan: ac.lifeSpan } })
    assetCats[ac.code] = item
  }

  const equipmentTemplates = [
    { catKey: 'CAT-INFO', name: 'Computador Desktop Dell OptiPlex 7090 i7 16GB 512GB SSD', brand: 'Dell', model: 'OptiPlex 7090', val: 4800.00 },
    { catKey: 'CAT-INFO', name: 'Notebook Lenovo ThinkPad E14 Intel Core i5 16GB SSD', brand: 'Lenovo', model: 'ThinkPad E14', val: 4200.00 },
    { catKey: 'CAT-INFO', name: 'Tablet Samsung Galaxy Tab A8 10.5 64GB Wi-Fi', brand: 'Samsung', model: 'Galaxy Tab A8', val: 1450.00 },
    { catKey: 'CAT-INFO', name: 'Impressora Multifuncional Xerox WorkCentre 3345', brand: 'Xerox', model: 'WorkCentre 3345', val: 3900.00 },
    { catKey: 'CAT-INFO', name: 'Impressora Laser HP LaserJet Enterprise M507dn', brand: 'HP', model: 'LaserJet M507dn', val: 3200.00 },
    { catKey: 'CAT-INFO', name: 'Projetor Multimídia Epson PowerLite E20 3400 Lumens', brand: 'Epson', model: 'PowerLite E20', val: 2850.00 },
    { catKey: 'CAT-INFO', name: 'Nobreak APC Smart-UPS 1500VA 230V', brand: 'APC', model: 'Smart-UPS 1500', val: 2400.00 },

    { catKey: 'CAT-FERR', name: 'Furadeira de Impacto Bosch GSB 550W Professional 1/2"', brand: 'Bosch', model: 'GSB 550', val: 380.00 },
    { catKey: 'CAT-FERR', name: 'Decibelímetro Digital com Datalogger Portátil', brand: 'Minipa', model: 'MDA-02', val: 890.00 },
    { catKey: 'CAT-FERR', name: 'Serra Tico-Tico DeWalt 500W com Maleta', brand: 'DeWalt', model: 'DW300', val: 620.00 },
    { catKey: 'CAT-FERR', name: 'Lavadora de Alta Pressão Kärcher HD 585 Profissional', brand: 'Kärcher', model: 'HD 585', val: 2450.00 },

    { catKey: 'CAT-CLIM', name: 'Cafeteira Industrial 10 Litros Inox Automática', brand: 'Britânia', model: 'Inox 10L', val: 1250.00 },
    { catKey: 'CAT-CLIM', name: 'Aparelho de Ar Condicionado Split Inverter 18000 BTUs', brand: 'LG', model: 'Dual Inverter', val: 3400.00 },
    { catKey: 'CAT-CLIM', name: 'Bebedouro de Coluna Inox com Garrafão 20L', brand: 'IBBL', model: 'BGF110', val: 980.00 },

    { catKey: 'CAT-MEDEQUIP', name: 'Monitor Multiparâmetros de Sinais Vitais Hospitalar', brand: 'Mindray', model: 'ePM 10', val: 1850.00 },
    { catKey: 'CAT-MEDEQUIP', name: 'Desfibrilador Externo Automático DEA Portátil', brand: 'Instromedix', model: 'DEA-01', val: 7800.00 },
    { catKey: 'CAT-MEDEQUIP', name: 'Autoclave de Mesa 21 Litros Inox Digital', brand: 'Cristófoli', model: 'Vitale 21', val: 5600.00 },

    { catKey: 'CAT-MOV', name: 'Mesa de Reunião Oval 8 Lugares Amadeirada', brand: 'Marelli', model: 'Executiva', val: 2100.00 },
    { catKey: 'CAT-MOV', name: 'Cadeira Ergonômica Presidente Giratória Mesh NR17', brand: 'Flexform', model: 'Tecton', val: 1150.00 },
    { catKey: 'CAT-MOV', name: 'Armário de Aço 2 Portas 4 Prateleiras Cinza', brand: 'Pandin', model: 'AP40', val: 790.00 },

    { catKey: 'CAT-VEIC', name: 'Ambulância UTI Móvel Mercedes Sprinter 416', brand: 'Mercedes-Benz', model: 'Sprinter 416 CDI', val: 340000.00 },
    { catKey: 'CAT-VEIC', name: 'Veículo Hatch Volkswagen Gol 1.0 Flex', brand: 'Volkswagen', model: 'Gol 1.0', val: 58000.00 }
  ]

  const totalAssetsToCreate = 310
  const createdAssetsList: any[] = []

  for (let i = 1; i <= totalAssetsToCreate; i++) {
    const patNum = `PAT${String(i).padStart(5, '0')}`
    const tpl = equipmentTemplates[(i - 1) % equipmentTemplates.length]
    const category = assetCats[tpl.catKey]
    
    const statuses = ['Ativo', 'Em uso', 'Em uso', 'Em uso', 'Ocioso', 'Em manutenção']
    const status = statuses[(i - 1) % statuses.length]

    const depts = [deptAdmin.id, deptSaude.id, deptEducacao.id, deptObras.id]
    const deptId = depts[(i - 1) % depts.length]

    const acqDate = new Date(2025, (i % 12), (i % 28) + 1)

    const asset = await prisma.asset.upsert({
      where: { patrimonyNumber: patNum },
      update: {
        name: `${tpl.name} - Nº ${i}`,
        brand: tpl.brand,
        model: tpl.model,
        serialNumber: `SN-${tpl.brand.substring(0,3).toUpperCase()}-${20250000 + i}`,
        status,
        acquisitionDate: acqDate,
        acquisitionValue: tpl.val,
        currentValue: tpl.val * 0.9,
        categoryId: category.id,
        departmentId: deptId,
        supplierId: supplier.id,
        createdAt: acqDate
      },
      create: {
        patrimonyNumber: patNum,
        name: `${tpl.name} - Nº ${i}`,
        brand: tpl.brand,
        model: tpl.model,
        serialNumber: `SN-${tpl.brand.substring(0,3).toUpperCase()}-${20250000 + i}`,
        status,
        acquisitionDate: acqDate,
        acquisitionValue: tpl.val,
        currentValue: tpl.val * 0.9,
        categoryId: category.id,
        departmentId: deptId,
        supplierId: supplier.id,
        createdAt: acqDate
      }
    })
    createdAssetsList.push(asset)
  }

  // 9. Histórico de Requisições Internas (20 Recomendações)
  console.log('Gerando histórico de requisições internas...')
  const sampleMaterial = await prisma.material.findFirst({ where: { code: 'MAT00001' } })
  if (sampleMaterial) {
    for (let r = 1; r <= 20; r++) {
      const reqNum = `REQ-2026-${String(r).padStart(3, '0')}`
      const reqStatus = r % 3 === 0 ? 'Atendida' : r % 3 === 1 ? 'Pendente' : 'Em Análise'
      
      const reqExists = await prisma.materialRequest.findFirst({ where: { number: reqNum } })
      if (!reqExists) {
        await prisma.materialRequest.create({
          data: {
            number: reqNum,
            departmentId: deptAdmin.id,
            requesterId: almoxarife1.id,
            status: reqStatus,
            date: new Date(2026, 8, (r % 20) + 1),
            justification: `Requisição periódica de reposição de almoxarifado #${r}`,
            items: {
              create: {
                materialId: sampleMaterial.id,
                quantityRequested: 15 + r
              }
            }
          }
        })
      }
    }
  }

  // 10. Histórico Mensal de Inventários (2026)
  console.log('Gerando histórico mensal de inventários para 2026...')
  const adminUser = await prisma.usuario.findFirst() || await prisma.usuario.create({
    data: {
      name: 'Administrador do Sistema',
      email: 'admin@prefeitura.gov.br',
      role: 'ADMIN'
    }
  })

  const sampleStock = await prisma.materialStock.findFirst({ include: { material: true } })
  if (sampleStock) {
    for (let m = 1; m <= 8; m++) {
      const monthWh = warehouses[(m - 1) % 4]
      const invDate = new Date(2026, m - 1, 15)

      await prisma.inventorySession.create({
        data: {
          warehouseId: monthWh.id,
          status: 'CLOSED',
          lockMovements: false,
          startedAt: invDate,
          closedAt: new Date(2026, m - 1, 18),
          approvedAt: new Date(2026, m - 1, 18),
          createdByUsuarioId: adminUser.id,
          approvedByUsuarioId: adminUser.id,
          approvalEvidence: `Inventário mensal referente ao mês ${m}/2026 concluído com aprovação técnica.`,
          items: {
            create: {
              stockId: sampleStock.id,
              expectedQuantity: sampleStock.quantity,
              countedQuantity: sampleStock.quantity,
              divergenceType: 'SEM_DIVERGENCIA',
              countEvidence: 'Contagem conferida por leitor óptico e conferência física.',
              adjustmentReason: 'Estoque conferido de acordo com saldo contábil.'
            }
          }
        }
      })
    }
  }

  // 11. Histórico de Baixas e Ajustes de Valor para Ciclo de Vida
  console.log('Gerando histórico de Baixas e Ajustes de Valor...')
  if (createdAssetsList.length > 5) {
    for (let b = 0; b < 5; b++) {
      const assetToDispose = createdAssetsList[b]
      const disposalVal = b % 2 === 0 ? 0 : 500 + (b * 200)
      const bkVal = assetToDispose.acquisitionValue * 0.5
      await prisma.assetWriteOff.create({
        data: {
          assetId: assetToDispose.id,
          date: new Date(2026, b, 10),
          type: b % 2 === 0 ? 'Baixa' : 'Alienação',
          reason: b % 2 === 0 ? 'Obsolescência e desuso comprovado por laudo técnico' : 'Leilão público oficial de bens inservíveis',
          justification: 'Processo regular homologado pela comissão permanente de patrimônio.',
          disposalValue: disposalVal,
          bookValue: bkVal,
          gainLoss: disposalVal - bkVal
        }
      })
    }

    for (let a = 5; a < 10; a++) {
      const assetToAdjust = createdAssetsList[a]
      const openVal = assetToAdjust.acquisitionValue
      const adjVal = openVal * 0.15
      const closeVal = openVal + adjVal
      await prisma.assetValueAdjustment.create({
        data: {
          assetId: assetToAdjust.id,
          date: new Date(2026, a, 12),
          type: 'REVALUATION',
          openingValue: openVal,
          adjustmentValue: adjVal,
          closingValue: closeVal,
          justification: 'Reavaliação patrimonial periódica conforme laudo de avaliação pericial.',
          evidence: 'Laudo Pericial Nº 2026/044'
        }
      })
    }
  }

  console.log('✅ SEED COMPLETO EXECUTADO COM SUCESSO!')
}

main()
  .catch((e) => {
    console.error('Erro ao executar seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
