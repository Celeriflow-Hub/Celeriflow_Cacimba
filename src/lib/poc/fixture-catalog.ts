export const POC_FIXTURE_DATASET_ID = "poc-aurora-das-veredas-v1";

export const pocFixture = {
  municipalityName: "Aurora das Veredas",
  state: "MG",
  cityHallName: "Prefeitura Municipal de Aurora das Veredas",
  chamberName: "Câmara Municipal de Aurora das Veredas",
  emailDomain: "aurora-das-veredas.poc.test",
  bankName: "Banco Simulado Aurora",
} as const;

export const pocFixtureUsers = {
  admin: {
    legacyEmail: "adminteste@email.com",
    email: "marina.azevedo@aurora-das-veredas.poc.test",
    name: "Marina Azevedo",
  },
  manager: {
    legacyEmail: "gestao1@email.com",
    email: "ricardo.mendonca@aurora-das-veredas.poc.test",
    name: "Ricardo Mendonça",
  },
  operator: {
    legacyEmail: "servidor1@email.com",
    email: "paula.nogueira@aurora-das-veredas.poc.test",
    name: "Paula Nogueira",
  },
  accountant: {
    legacyEmail: "contadorteste@email.com",
    email: "helena.duarte@aurora-das-veredas.poc.test",
    name: "Helena Duarte",
  },
  citizenOne: {
    legacyEmail: "pessoateste1@email.com",
    email: "joana.martins@aurora-das-veredas.poc.test",
    name: "Joana Martins",
  },
  citizenTwo: {
    legacyEmail: "pessoateste2@email.com",
    email: "lucas.barros@aurora-das-veredas.poc.test",
    name: "Lucas Barros",
  },
  evaluatorTechnology: {
    email: "avaliacao.tecnologia@aurora-das-veredas.poc.test",
    name: "Diego Ferraz",
  },
  evaluatorFinance: {
    email: "avaliacao.financas@aurora-das-veredas.poc.test",
    name: "Camila Reis",
  },
  evaluatorAccounting: {
    email: "avaliacao.contabilidade@aurora-das-veredas.poc.test",
    name: "Otávio Paes",
  },
} as const;

const givenNames = [
  "Adriana", "Aline", "Amanda", "André", "Beatriz", "Bruno", "Camila", "Carlos", "Clara", "Daniel", "Diego", "Elisa",
  "Fabiana", "Felipe", "Gabriela", "Gustavo", "Helena", "Hugo", "Isabela", "João", "Juliana", "Larissa", "Leandro", "Letícia",
  "Lucas", "Mariana", "Mateus", "Natália", "Otávio", "Patrícia", "Rafael", "Renata", "Rodrigo", "Sabrina", "Thiago", "Valéria",
];

const surnames = [
  "Azevedo", "Barbosa", "Barros", "Campos", "Cardoso", "Carvalho", "Castro", "Correia", "Costa", "Duarte", "Ferreira", "Fonseca",
  "Freitas", "Lima", "Machado", "Martins", "Mendes", "Mendonça", "Monteiro", "Moreira", "Nascimento", "Nogueira", "Oliveira", "Paes",
  "Pereira", "Ramos", "Reis", "Ribeiro", "Rocha", "Santos", "Silva", "Souza", "Teixeira", "Vasconcelos", "Viana", "Xavier",
];

const neighborhoods = [
  "Centro", "Jardim das Acácias", "Boa Vista", "Vila Esperança", "Nova Aurora", "Parque das Veredas", "São Miguel", "Vale Verde",
];

const streets = [
  "Rua das Veredas", "Avenida do Ipê", "Rua Serra Clara", "Rua do Comércio", "Avenida das Nascentes", "Rua das Palmeiras", "Rua da Estação", "Alameda dos Cedros",
];

const supplierPrefixes = ["Veredas", "Horizonte", "Minas", "Aurora", "Vale", "Caminhos", "Serras", "Ponto"];
const supplierSegments = ["Papelaria", "Tecnologia", "Construções", "Alimentos", "Saúde", "Mobilidade", "Serviços", "Equipamentos"];

const procurementObjects = [
  "registro de preços para aquisição parcelada de gêneros alimentícios destinados à alimentação escolar",
  "fornecimento de material de expediente para as unidades administrativas",
  "manutenção preventiva e corretiva da frota municipal",
  "aquisição de medicamentos e insumos para atenção primária",
  "execução de serviços de pavimentação e drenagem urbana",
  "locação de equipamentos para conservação de estradas vicinais",
  "fornecimento de equipamentos de informática para escolas municipais",
  "serviços técnicos de manutenção da iluminação pública",
];

const materialNames = [
  "Notebook corporativo 14 polegadas", "Impressora multifuncional laser", "Cadeira ergonômica para escritório", "Arquivo de aço com quatro gavetas",
  "Projetor multimídia portátil", "Roteador corporativo de alta capacidade", "Mesa de reunião para oito lugares", "Kit de ferramentas para manutenção predial",
];

const works = [
  "Pavimentação e drenagem da Rua das Nascentes", "Reforma da Unidade Básica de Saúde Vale Verde", "Ampliação da Escola Municipal Caminhos do Saber",
  "Revitalização da Praça das Araucárias", "Construção de passarela sobre o Córrego Aurora", "Recapeamento da Avenida do Ipê",
  "Implantação de iluminação LED no Parque das Veredas", "Adequação do Centro de Referência de Assistência Social",
];

const culturalProjects = [
  "Circuito de Música nas Praças", "Memória Oral das Veredas", "Oficinas de Artesanato do Vale", "Cinema Itinerante nos Bairros",
  "Encontro de Violeiros de Aurora", "Biblioteca Viva nas Comunidades", "Mostra de Teatro Estudantil", "Feira de Saberes e Sabores",
];

function valueAt<T>(values: readonly T[], index: number, multiplier = 1) {
  return values[(index * multiplier) % values.length];
}

function calculateCpfDigit(value: string, factor: number) {
  const sum = value.split("").reduce((total, digit, index) => total + Number(digit) * (factor - index), 0);
  const remainder = (sum * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}

function calculateCnpjDigit(value: string, weights: number[]) {
  const sum = value.split("").reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function syntheticCpf(seed: number) {
  const base = String(110000000 + seed).padStart(9, "0").slice(-9);
  const firstDigit = calculateCpfDigit(base, 10);
  const secondDigit = calculateCpfDigit(`${base}${firstDigit}`, 11);
  const value = `${base}${firstDigit}${secondDigit}`;
  return `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`;
}

export function syntheticCnpj(seed: number) {
  const base = `${String(12000000 + seed).padStart(8, "0")}0001`;
  const firstDigit = calculateCnpjDigit(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateCnpjDigit(`${base}${firstDigit}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const value = `${base}${firstDigit}${secondDigit}`;
  return `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8, 12)}-${value.slice(12)}`;
}

export function syntheticPersonName(index: number) {
  return `${valueAt(givenNames, index)} ${valueAt(surnames, index, 7)} ${valueAt(surnames, index + 3, 13)}`;
}

export function syntheticPersonEmail(index: number) {
  return `cadastro.${String(index).padStart(3, "0")}@${pocFixture.emailDomain}`;
}

export function syntheticPhone(index: number) {
  const suffix = String(1000 + ((index * 37) % 9000));
  return `(31) 9${String(8000 + (index % 1500)).slice(-4)}-${suffix}`;
}

export function syntheticAddress(index: number) {
  const number = 100 + ((index * 17) % 1800);
  return `${valueAt(streets, index)}, ${number}, ${valueAt(neighborhoods, index, 3)}, ${pocFixture.municipalityName} - ${pocFixture.state}`;
}

export function syntheticSupplier(index: number) {
  const prefix = valueAt(supplierPrefixes, index);
  const segment = valueAt(supplierSegments, index, 3);
  return {
    corporateName: `${prefix} ${segment} Ltda.`,
    tradeName: `${segment} ${prefix}`,
    email: `contato.${String(index).padStart(3, "0")}@fornecedores.${pocFixture.emailDomain}`,
    segment,
  };
}

export function syntheticProcurementObject(index: number) {
  return valueAt(procurementObjects, index);
}

export function syntheticMaterialName(index: number) {
  return valueAt(materialNames, index);
}

export function syntheticWorkName(index: number) {
  return valueAt(works, index);
}

export function syntheticCulturalProjectName(index: number) {
  return valueAt(culturalProjects, index);
}
