# Análise de Aderência do CeleriFlow à POC de Cacimba de Dentro/PB

Data da análise: 24/09/2026

## 1. Objetivo

Este documento compara o código atualmente disponível no projeto CeleriFlow Cacimba com as funcionalidades esperadas para a POC de Cacimba de Dentro/PB.

O escopo considerado contém sete componentes:

1. Gestão Tributária.
2. Portal do Contribuinte, integrado ao Portal Institucional.
3. Folha de Pagamento.
4. Portal do Servidor.
5. Gestão de Frota.
6. Portal da Frota.
7. Farmácia.

A avaliação foi feita por inspeção do código, schema Prisma, migrations, serviços, páginas, APIs, relatórios e testes copiados do ambiente de Divino. Ela não substitui testes com banco configurado, integrações externas, massa de dados de Cacimba ou validação formal do edital e do roteiro oficial da POC.

## 2. Critérios de classificação

| Situação | Significado |
|---|---|
| Implementado | Existe persistência, regra de negócio e interface ou serviço utilizável para o fluxo principal. Ainda pode exigir parametrização e homologação. |
| Parcial | Existe base relevante, mas falta etapa essencial, documento oficial, integração, regra municipal ou experiência completa. |
| Ausente | Não foi encontrada implementação suficiente para demonstrar o requisito. |
| Parametrização | A funcionalidade existe, mas precisa receber identidade, legislação, usuários, cadastros e dados de Cacimba. |

## 3. Conclusão executiva

A base de Divino é tecnicamente reaproveitável e evita reconstruir autenticação, permissões, cadastros gerais, documentos, auditoria, relatórios e grande parte dos domínios funcionais. Entretanto, a cópia atual ainda não está pronta para ser apresentada como uma POC completa de Cacimba.

| Componente | Situação geral | Principal necessidade |
|---|---|---|
| Gestão Tributária | Parcial avançado | Remover parâmetros demonstrativos, concluir documentos oficiais e validar os fluxos de Cacimba. |
| Portal do Contribuinte | Parcial | Transformar a consulta existente em autosserviço transacional e corrigir o provisionamento do cidadão. |
| Folha de Pagamento | Parcial inicial | Criar o motor oficial e conectar as regras parametrizadas ao processamento. |
| Portal do Servidor | Parcial | Gerar contracheque, ficha financeira, informe e documentos para download e validação. |
| Gestão de Frota | Parcial avançado | Completar condutores, locações, abastecimento, manutenção, competência e SAGRES. |
| Portal da Frota | Ausente | Criar toda a projeção pública automatizada. |
| Farmácia | Parcial avançado | Completar reservas, alertas, posição mensal, receituário e SAGRES. |

As quatro entregas mais críticas são:

1. Conector TCE-PB/SAGRES para Folha, Frota e Farmácia.
2. Motor real da Folha de Pagamento.
3. Portal da Frota.
4. Parametrização completa e remoção das referências e regras demonstrativas de Divino.

## 4. Dependências comuns já disponíveis

Estas capacidades podem ser compartilhadas pelos sete componentes:

| Capacidade | Situação atual | Trabalho restante |
|---|---|---|
| Autenticação | Implementada com Firebase e sessão no servidor | Configurar projeto/credenciais de Cacimba e validar recuperação e provisionamento. |
| Usuários, perfis e permissões | Implementado por módulo e operações genéricas | Criar perfis da POC e, quando necessário, permissões funcionais mais específicas. |
| Organograma | Implementado com secretarias, departamentos e unidades | Cadastrar a estrutura real de Cacimba. |
| Pessoas, empresas e fornecedores | Implementado | Importar ou criar massa coerente para a demonstração. |
| GED e documentos | Implementado com versões, hash, assinatura interna e código público | Integrar documentos específicos de cada módulo e definir validade jurídica. |
| Auditoria | Parcial | Ampliar eventos de Farmácia, Folha e operações críticas; validar trilha de antes/depois quando exigida. |
| Relatórios | Motor compartilhado implementado | Criar relatórios oficiais que ainda não existem e revisar semântica dos atuais. |
| Configuração de instância | Parcial | Consolidar dados de Cacimba e eliminar valores fixos de Divino no código. |
| Branding | Parcial | Brasão, logotipo e instituição existem, mas cores, favicon e vários textos permanecem fixos. |
| Ativação de módulos | Implementada | Exibir somente Tributário, Folha, Frota e Farmácia na área interna da POC. |
| Integrações externas | Catálogo e infraestrutura parcial | Várias integrações são simuladas ou bloqueadas fora de MOCK/SANDBOX. |

### 4.1 Risco de parametrização

Ainda existem referências fixas a Divino de São Lourenço em páginas do portal, metadados, links, endereços, imagens, conteúdo institucional, seeds e regras tributárias. Antes da POC, deve ser realizada uma revisão controlada, arquivo por arquivo, para substituir essas referências por configuração institucional ou conteúdo de Cacimba.

Também existem regras marcadas explicitamente como demonstração. Elas não podem ser apresentadas como legislação válida de Cacimba sem revisão administrativa, contábil e jurídica.

## 5. Gestão Tributária

### 5.1 Matriz funcional

| Funcionalidade da POC | Situação atual | O que já existe | O que precisa ser desenvolvido ou validado |
|---|---|---|---|
| Pessoas físicas e jurídicas | Implementado | Pessoas, empresas, contribuintes, CPF/CNPJ e pesquisa por documento ou inscrição | Validar importação, duplicidade e vínculo correto com o cidadão externo. |
| Cadastro imobiliário | Parcial | Imóveis, inscrição, proprietário, áreas e subunidades | Concluir avaliação oficial, regras territoriais e geração anual/massiva do IPTU. |
| IPTU | Parcial | Imóvel pode originar lançamento e guia | Parametrizar planta de valores, alíquotas, descontos, isenções, calendário e emissão em lote. |
| Cadastro econômico, ISS e taxas | Parcial | Empresas, CNAE, regime, atividades, alíquotas, declarações e lançamentos | Configurar legislação de Cacimba e completar taxas e integrações oficiais. |
| ITBI | Implementado com ressalvas | Declaração, partes, cálculo, análise, lançamento, DAM, documento e atualização cadastral | Remover alíquota/tipos demonstrativos, revisar workflow e validar documento oficial. |
| Alvarás | Parcial | Cadastro, validade, situação e vínculo econômico | Criar análise documental, emissão oficial, QR Code/código de autenticidade e validação pública. |
| Lançamentos | Implementado | Motor parametrizado, memória de cálculo, vigência, vínculos e revisão | Configurar tributos e testar os cenários exigidos pela POC. |
| DAM e segunda via | Parcial | Emissão integral, parcial, agrupada e impressão | Criar código de barras/PIX real, autosserviço de segunda via e homologação bancária. |
| Arrecadação e baixa | Implementado com ressalvas | Baixa parcial/integral, idempotência, comprovante e movimentos financeiros | Homologar retorno bancário e limitar baixa manual conforme perfil e processo. |
| Parcelamentos | Parcial | Regras, acordo, cotas, pagamentos, reparcelamento e rompimento | Remover cenário fixo demonstrativo, validar dívida de origem e emitir DAM por parcela. |
| Dívida ativa e CDA | Implementado com ressalvas | Inscrição, CDA, PDF, suspensão, baixa, prescrição, protesto e execução interna | Integrar assinatura válida, cartório/protesto e processo judicial quando exigidos. |
| Certidões | Parcial | Avaliação interna da situação fiscal e cadastro | Substituir rascunho interno por documento oficial, autenticação e consulta pública. |
| Fiscalização e autos | Implementado com ressalvas | Planejamento, OS, TIAF, documentos, mapa fiscal, auto, lançamento, DAM e DTE | Completar defesa/contencioso e validar ciência eletrônica. |
| NFS-e | Parcial | Credenciamento, emissão, retenção, substituição, cancelamento, RPS, DMS, PDF/XML e consulta pública | Retirar configuração demonstrativa, adotar padrão/provedor oficial, certificado e homologação. |
| Simples Nacional | Parcial | Importações, cruzamentos, divergências, DTE e preparação de exclusão | Integrar serviços oficiais da Receita e efetivação dos atos externos. |
| Relatórios e auditoria | Parcial avançado | Relatórios e trilhas em várias operações | Definir relatórios obrigatórios, dados de POC e cobertura ponta a ponta. |

### 5.2 Fluxo mínimo esperado

O fluxo de demonstração deve operar com dados persistidos e consistentes:

```text
Contribuinte
  -> imóvel ou empresa
  -> lançamento
  -> DAM
  -> pagamento ou baixa
  -> dívida ativa ou parcelamento, quando aplicável
  -> certidão
```

### 5.3 Critérios de aceite

- Criar e alterar contribuinte, imóvel e empresa durante a apresentação.
- Calcular um tributo usando parâmetros identificados como pertencentes a Cacimba.
- Emitir DAM reutilizável pelo Portal do Contribuinte.
- Registrar pagamento ou baixa e atualizar o saldo sem redigitação.
- Emitir certidão com código público verificável.
- Demonstrar ITBI, NFS-e e fiscalização sem valores ou textos marcados como DEMO.
- Registrar auditoria das etapas críticas.

## 6. Portal Institucional e Portal do Contribuinte

### 6.1 Situação atual

O Portal Institucional existe, assim como uma área tributária que consulta imóveis, empresas, lançamentos, guias, pagamentos, dívida, certidões, processos, parcelamentos, ITBI e DTE. Entretanto, os dois ainda não formam um produto externo completo.

| Funcionalidade da POC | Situação atual | Desenvolvimento necessário |
|---|---|---|
| Acesso pelo portal institucional | Ausente na integração atual | Substituir links externos/legados e conduzir o cidadão aos serviços internos. |
| Login do contribuinte | Parcial | Criar fluxo próprio do cidadão e revisar autorização sem exigir perfil interno de Tributação. |
| Vínculo CPF/CNPJ/inscrição | Parcial | Corrigir o provisionamento para vincular o contribuinte ao usuário cidadão, não ao operador que concede acesso. |
| Consulta de débitos | Implementado para usuário vinculado | Melhorar seleção de contribuinte e experiência de consulta. |
| IPTU e segunda via | Parcial | Permitir seleção, emissão e download no portal. |
| DAM | Parcial | Criar emissão pelo cidadão e integrar cobrança bancária real. |
| Certidões | Parcial | Solicitar, emitir, baixar e validar documento oficial. |
| ITBI | Parcial | Criar protocolo e acompanhamento externo. |
| Alvarás | Parcial | Criar solicitação, acompanhamento, documento e validação. |
| Parcelamento | Parcial | Simular, solicitar, aceitar termo e emitir parcelas a partir da dívida real. |
| NFS-e | Parcial | Integrar emissão/consulta conforme perfil do prestador e provedor oficial. |
| Validação documental | Parcial | Abranger DAM, certidão, alvará, ITBI, CDA e demais documentos emitidos. |
| Autosserviço | Parcial inicial | Converter páginas predominantemente consultivas em operações completas. |

### 6.2 Critérios de aceite

- Um cidadão sem perfil administrativo deve conseguir acessar apenas os próprios dados.
- O vínculo deve ser comprovado e auditável.
- O cidadão deve emitir ao menos DAM/IPTU e certidão sem intervenção do operador.
- O pagamento ou baixa deve refletir no portal em tempo adequado à POC.
- Documentos emitidos devem possuir download e validação pública.
- Nenhum serviço prioritário deve redirecionar para endereço de Divino ou fornecedor não definido para Cacimba.

## 7. Folha de Pagamento

### 7.1 Diagnóstico

O projeto contém cadastro de servidor, folha, eventos legados e uma estrutura nova de regras, rubricas, incidências, regimes previdenciários e políticas versionadas. Contudo, a estrutura nova não é consumida pelo processamento atual. O próprio código identifica as regras como demonstrativas e informa que não representam folha oficial, remessa bancária, eSocial ou cálculo homologado.

| Funcionalidade da POC | Situação atual | O que precisa ser desenvolvido |
|---|---|---|
| Cadastro funcional | Parcial | Completar admissão, desligamento, dados civis/bancários, previdência, histórico e documentos. |
| Múltiplos vínculos | Ausente | Criar vínculo funcional próprio por servidor, com matrícula, vigência, cargo, lotação, jornada e regime. |
| Cargos, lotações e jornadas | Parcial | Criar histórico, planos/classes/níveis, escalas e vigência. |
| Regimes de trabalho e previdência | Parcial | Ligar os catálogos existentes aos vínculos efetivos. |
| Rubricas e incidências | Parcial avançado | Conectar rubricas versionadas ao motor e congelar configuração por competência. |
| INSS/RGPS e RPPS | Parcial como cadastro | Implementar cálculo progressivo/linear, teto, patronal e memória de cálculo. |
| IRRF | Ausente no cálculo | Criar tabelas por vigência, dependentes, deduções, desconto simplificado e cálculo. |
| FGTS | Ausente no cálculo | Criar base, depósito e incidências conforme vínculo. |
| Folha mensal | Parcial demonstrativo | Substituir soma simplificada por motor real. |
| Férias | Parcial demonstrativo | Integrar período aquisitivo, médias, adicional, abono e descontos. |
| 13º salário | Parcial demonstrativo | Implementar parcelas, médias, proporcionalidade e incidências. |
| Folha extra | Ausente | Criar tipo, regras e processamento. |
| Rescisão | Parcial apenas como tipo | Implementar cálculo e eventos rescisórios. |
| Simulação | Parcial | Separar prévia de processamento persistido. |
| Processamento | Parcial inicial | Criar pipeline versionado, transacional e reproduzível. |
| Crítica e homologação | Ausente | Criar validações, pendências, aprovação e trilha. |
| Fechamento por competência | Parcial | Tornar competência única, imutável, reabrível com auditoria e snapshot. |
| Contracheque | Parcial | Criar documento consolidado com bases, proventos, descontos, bruto, líquido e autenticação. |
| Arquivo bancário | Ausente | Cadastrar contas e gerar CNAB salarial com retorno vinculado à folha. |
| eSocial | Ausente operacionalmente | Implementar eventos, XML, assinatura, lotes, recibos e monitoramento. |
| SAGRES Mensal | Ausente | Criar extração, validação, leiaute, remessa e protocolo para pessoal/folha. |

### 7.2 Motor de folha necessário

O novo motor deve, no mínimo:

1. Selecionar vínculos válidos para a competência.
2. Congelar servidor, vínculo, salário, rubricas, tabelas e legislação em um snapshot.
3. Importar movimentos de ponto, férias, benefícios, afastamentos e lançamentos manuais.
4. Avaliar rubricas em ordem controlada.
5. Calcular bases, previdência, IRRF, FGTS, férias, 13º e tetos.
6. Produzir memória de cálculo por rubrica.
7. Executar críticas antes do fechamento.
8. Homologar e fechar a competência com trilha de auditoria.
9. Gerar contracheques, contabilização, arquivo bancário e obrigações.
10. Alimentar Portal do Servidor e SAGRES a partir do mesmo resultado fechado.

### 7.3 Critérios de aceite

- Processar pelo menos duas competências escolhidas durante a POC.
- Demonstrar mensal, férias, 13º e folha extra com regras diferentes.
- Reproduzir o mesmo resultado com o snapshot da competência.
- Exibir memória de cálculo de previdência e IRRF.
- Impedir alteração silenciosa de folha fechada.
- Gerar contracheque e SAGRES a partir dos mesmos itens calculados.

## 8. Portal do Servidor

| Funcionalidade da POC | Situação atual | Desenvolvimento necessário |
|---|---|---|
| Login vinculado ao servidor | Implementado | Parametrizar usuários e testar perfis reais. |
| Recuperação de acesso | Implementado por e-mail | Validar fluxo e decidir se matrícula/CPF também serão aceitos. |
| Dados funcionais | Parcial | Exibir vínculo, regime, admissão, histórico de cargo/lotação e referências. |
| Contracheques | Parcial | Trocar lista de eventos por documento consolidado por competência. |
| Download de contracheque | Ausente | Gerar PDF com hash, código/QR e validação pública. |
| Ficha financeira | Ausente | Criar visão anual/mensal e exportação. |
| Informe de rendimentos | Ausente | Criar consolidação anual, documento e autenticação. |
| Documentos funcionais | Parcial | Expor arquivo, download, assinatura/recusa e atos funcionais. |
| Validação de autenticidade | Parcial genérico | Integrar contracheque, informe e demais documentos ao GED. |

### 8.1 Critérios de aceite

- O servidor deve visualizar somente o próprio cadastro e documentos.
- Contracheque deve refletir uma folha fechada, sem cálculo paralelo.
- Ficha financeira e informe devem reconciliar com as competências processadas.
- Downloads devem possuir validação pública sem expor dados pessoais indevidos.

## 9. Gestão de Frota

### 9.1 Matriz funcional

| Funcionalidade da POC | Situação atual | O que precisa ser desenvolvido |
|---|---|---|
| Veículos, máquinas e equipamentos | Implementado parcialmente | Acrescentar regime de posse e permitir operações adequadas para máquinas. |
| Próprios, locados e cedidos | Ausente | Criar tipo de posse, vigência, valor e vínculo contratual. |
| Proprietários e locadores | Ausente | Vincular pessoa/empresa/fornecedor e documentos. |
| Motoristas e operadores | Parcial | Criar cadastro funcional específico e permitir operadores de máquinas. |
| CPF, CNH, categoria e validade | Parcial | Acrescentar CNH, categoria, validade e bloqueios automáticos. |
| Postos e fornecedores | Parcial | Criar cadastro de posto, endereço, bombas/cartões e rede credenciada quando aplicável. |
| Contratos e notas fiscais | Parcial | Relacionar abastecimento, manutenção e despesa ao contrato e NF reais. |
| Tipos de combustível | Implementado | Parametrizar catálogo e unidades. |
| Autorização de abastecimento | Ausente | Criar solicitação, aprovação, limites, validade, utilização e saldo. |
| Quantidade e valor | Implementado | Validar regras e obrigatoriedade por origem. |
| Hodômetro | Parcial | Registrar em abastecimento e validar sequência. |
| Horímetro | Ausente | Criar leituras para máquinas e equipamentos. |
| Saída e viagem | Parcial avançado | Tornar origem/destino obrigatórios e separar saída, previsão e retorno. |
| Manutenção preventiva | Implementado | Complementar leituras, contratos, fornecedor e documentos fiscais. |
| Manutenção corretiva | Parcial | Criar OS emergencial independente de plano e classificar peças/mão de obra. |
| Peças e serviços | Parcial | Estruturar itens, quantidades, custos, garantias e fornecedores. |
| Secretaria e setor | Parcial avançado | Preservar dimensão histórica da operação. |
| Unidade e centro de custo | Ausente no fato de frota | Vincular e permitir rateio/consolidação. |
| Consolidação por competência | Parcial por intervalo | Criar competência, fechamento, reabertura e snapshot mensal. |
| Relatórios | Implementado para uso interno | Adequar relatórios oficiais e publicação pública. |
| SAGRES Frota | Ausente | Implementar leiaute, validação, remessa, protocolo e retorno. |

### 9.2 Fluxo mínimo esperado

```text
Veículo ou máquina + condutor/operador
  -> autorização e saída
  -> viagem/utilização
  -> abastecimento
  -> retorno e leitura final
  -> manutenção/despesa, quando aplicável
  -> consolidação mensal
  -> SAGRES Frota
  -> publicação sanitizada no Portal da Frota
```

### 9.3 Critérios de aceite

- Bloquear condutor com CNH vencida ou incompatível.
- Registrar veículo próprio e locado, com proprietário/contrato.
- Vincular abastecimento à autorização, posto, nota e leitura.
- Demonstrar saída e retorno com cálculo de distância.
- Demonstrar manutenção preventiva e corretiva com peças e serviços.
- Fechar uma competência e gerar os dados SAGRES correspondentes.

## 10. Portal da Frota

O Portal da Frota não existe no código atual. Os relatórios existentes são internos, exigem autenticação e estão marcados explicitamente como não elegíveis à publicação pública.

### 10.1 Funcionalidades a criar

| Área pública | Conteúdo mínimo |
|---|---|
| Visão geral | Quantidade de veículos/máquinas, situação, gastos e indicadores do período. |
| Veículos e máquinas | Identificação pública, tipo, secretaria/unidade e situação. |
| Movimentações | Saídas, retornos, finalidade, distância e unidade responsável. |
| Abastecimentos | Data, veículo, combustível, quantidade, valor e fornecedor permitido para publicação. |
| Manutenções | Tipo, serviços, peças, período, fornecedor e custo publicável. |
| Despesas | Consolidação por veículo, natureza, unidade e competência. |
| Itinerários | Origem, destino e percurso, respeitando segurança e privacidade. |
| Filtros | Período, veículo, secretaria, tipo, situação e natureza da despesa. |
| Gráficos | Evolução de gasto, consumo, quilometragem e manutenção. |
| Relatórios e dados abertos | PDF/CSV/XLSX e API pública controlada. |

### 10.2 Regras arquiteturais

- O portal não deve possuir cadastro ou banco paralelo.
- A publicação deve vir automaticamente dos fatos da Gestão de Frota.
- Campos pessoais, operacionais sensíveis ou protegidos devem ser sanitizados.
- A política de publicação deve definir o que é imediato e o que depende de fechamento da competência.
- Totais do portal, relatórios internos e SAGRES devem reconciliar para o mesmo período.

## 11. Farmácia

### 11.1 Matriz funcional

| Funcionalidade da POC | Situação atual | O que precisa ser desenvolvido |
|---|---|---|
| Farmácias e unidades | Implementado | Parametrizar unidades, estoques e responsáveis de Cacimba. |
| Medicamentos e grupos | Implementado parcialmente | Completar NCM e revisar catálogos/classificações. |
| Código de barras | Implementado | Validar leitura e unicidade com massa real. |
| Fornecedores e entrada por NF | Parcial avançado | Importar/validar XML e vincular a NF ao GED. |
| Lotes, validade e unidade | Implementado | Homologar regras e carga inicial. |
| Estoque mínimo | Parcial | Expor política na interface e calcular alertas. |
| Alertas de vencimento | Parcial inicial | Criar faixas, notificações e painel operacional. |
| Pacientes, CPF e Cartão SUS/CNS | Implementado | Parametrizar/importar pacientes e validar LGPD. |
| Profissionais e registro | Implementado | Parametrizar profissionais, unidades e conselhos. |
| Prescrições | Implementado parcialmente | Adicionar validade, cancelamento, assinatura e documento formal. |
| Dispensação por paciente e lote | Implementado | Testar fluxo FEFO e controlados com dados da POC. |
| Reservas | Ausente | Criar reserva por paciente/prescrição/lote, expiração e liberação. |
| Histórico do paciente | Implementado | Validar filtros e permissões. |
| Transferências | Implementado | Testar expedição, trânsito, aceite e documentos. |
| Perdas e ajustes | Parcial | Criar taxonomia, auditoria explícita e interface completa. |
| Inventários | Parcial | Integrar o motor patrimonial à interface específica da Farmácia. |
| Receituário simples/controlado | Parcial | Criar tipos, numeração, vias, validade, retenção, assinatura e impressão. |
| AIH/BPA | Parcial | Implementar ou homologar leiautes oficiais, validação e retorno. |
| Laudos | Implementado no domínio de Saúde | Validar se faz parte do roteiro da Farmácia. |
| Relatórios de entrada/saída/saldo/vencimento | Parcial avançado | Corrigir relatórios genéricos e incluir saldo inicial/final e vencimento por faixa. |
| Posição mensal | Ausente | Criar fechamento, snapshot e reabertura auditada por competência. |
| SAGRES Farmácia | Ausente | Criar leiaute, validação, geração/transmissão, protocolo e retorno. |

### 11.2 Fluxo mínimo esperado

```text
Medicamento
  -> fornecedor e nota fiscal
  -> lote e validade
  -> entrada em estoque
  -> paciente e prescrição
  -> reserva, quando aplicável
  -> dispensação por lote
  -> baixa no estoque
  -> posição mensal
  -> SAGRES Farmácia
```

### 11.3 Critérios de aceite

- Receber medicamento por NF com lote, validade, quantidade e custo.
- Demonstrar saldo por unidade e alertas de mínimo/vencimento.
- Prescrever e dispensar para paciente identificado, com rastreabilidade do lote.
- Impedir dispensação de lote vencido ou bloqueado.
- Executar transferência entre unidades e inventário.
- Fechar uma posição mensal reconciliada com os movimentos.
- Gerar SAGRES da mesma competência fechada.

## 12. TCE-PB/SAGRES

### 12.1 Situação atual

O catálogo contém a integração `TCE_PB_SAGRES`, mas sua implementação atual aceita somente operações de licitações e contratos e está restrita ao ambiente `MOCK`. Não existem operações de Folha, Frota ou Farmácia.

### 12.2 Arquitetura necessária

```text
Conector TCE-PB / SAGRES
  -> Folha / SAGRES Mensal
  -> Frota / SAGRES Frota
  -> Farmácia / SAGRES Farmácia
  -> validação por competência
  -> geração do pacote
  -> transmissão ou exportação
  -> protocolo e retorno
  -> pendências e correções
  -> reenvio auditável
```

O conector deve compartilhar infraestrutura de fila, idempotência, histórico e protocolo, mas cada módulo deve ser responsável pela consistência e pelo fechamento dos seus próprios dados.

### 12.3 Entregas por módulo

| Módulo | Dados de origem | Entrega necessária |
|---|---|---|
| Folha | Vínculos, rubricas, bases, proventos, descontos, encargos e competência fechada | SAGRES Mensal validado e reconciliado com os contracheques. |
| Frota | Veículos, condutores, viagens, abastecimentos, manutenções, despesas e competência | SAGRES Frota reconciliado com relatórios e Portal da Frota. |
| Farmácia | Unidades, produtos, lotes, entradas, saídas, dispensações, ajustes e posição mensal | SAGRES Farmácia reconciliado com o fechamento do estoque. |

### 12.4 Critérios de aceite

- Selecionar qualquer competência preparada para a POC.
- Validar campos obrigatórios antes de gerar a remessa.
- Exibir erros com origem e registro corrigível.
- Gerar pacote determinístico para a mesma versão fechada.
- Registrar hash, data, usuário, situação, protocolo e retorno.
- Permitir correção e reenvio sem apagar o histórico anterior.

## 13. Requisitos transversais da demonstração

Para considerar uma funcionalidade pronta para a POC, não basta existir uma tela. Cada fluxo deve comprovar:

- inclusão e alteração de dados;
- persistência e recuperação após recarregar a página;
- autorização por usuário e perfil;
- integração entre módulos sem redigitação;
- auditoria da operação;
- geração de documento ou relatório quando exigido;
- consistência dos totais;
- funcionamento com competência escolhida na apresentação;
- tratamento de erro e tentativa duplicada;
- ausência de dados fixos, regras e marcas de Divino;
- proteção de CPF, CNS, dados funcionais e informações clínicas;
- operação em ambiente controlado com plano de contingência.

Também devem ser preparados os três canais de suporte solicitados para a POC: chat, e-mail e telefone, com evidência de funcionamento e responsáveis definidos.

## 14. Plano recomendado de implementação

### Fase 0 — Base executável e inventário oficial

- Validar o armazenamento Blob da instância de Cacimba.
- Suíte automatizada validada em schema Neon isolado: 242 testes unitários e 6 testes SIAFIC aprovados em 24/09/2026.
- Build de produção aprovado em 24/09/2026.
- Confirmar o texto oficial do edital e transformar cada item em caso de aceite.
- Identificar e parametrizar todas as referências fixas de Divino.

### Fase 1 — Instância Cacimba e segurança

- Configurar município, CNPJ, endereço, brasão, identidade e domínio.
- Cadastrar organograma, usuários, perfis e unidades.
- Ativar somente os módulos necessários para a POC.
- Definir massa integrada de contribuinte, servidor, frota e Farmácia.
- Revisar permissões, auditoria e LGPD.

### Fase 2 — Fechar fluxos com maior base pronta

- Concluir Tributário e Portal do Contribuinte.
- Completar Gestão de Frota.
- Completar Farmácia e posição mensal.
- Criar Portal da Frota.

### Fase 3 — Folha e Portal do Servidor

- Criar vínculos funcionais.
- Implementar motor versionado da folha.
- Implementar fechamento e documentos oficiais.
- Criar ficha financeira e informe de rendimentos.
- Implementar CNAB/eSocial conforme escopo confirmado.

### Fase 4 — SAGRES

- Implementar adaptador compartilhado.
- Entregar e validar Folha, Frota e Farmácia separadamente.
- Homologar leiautes, validações, protocolos e reenvios.

### Fase 5 — POC ponta a ponta

- Preparar mais de uma competência coerente.
- Ensaiar os sete componentes sem alteração manual no banco.
- Reconciliar documentos, portais, relatórios e SAGRES.
- Registrar evidências de cada requisito.
- Preparar roteiro principal, contingência e restauração da massa de demonstração.

## 15. Priorização

### Prioridade crítica

1. Confirmar matriz oficial de requisitos e leiautes SAGRES.
2. Criar o motor real da Folha.
3. Implementar SAGRES Folha, Frota e Farmácia.
4. Criar o Portal da Frota.
5. Corrigir autenticação e autosserviço do Portal do Contribuinte.
6. Remover parâmetros demonstrativos e referências fixas de Divino.

### Prioridade alta

1. Completar vínculos funcionais, contracheques, ficha financeira e informe.
2. Completar condutores, locações, abastecimento, manutenção e competência de Frota.
3. Completar reservas, alertas, receituário e posição mensal da Farmácia.
4. Oficializar certidões, alvarás, DAM e documentos tributários.
5. Parametrizar Cacimba e criar massa integrada da POC.

### Prioridade de homologação

1. Integrações bancárias, fiscais e governamentais.
2. Segurança, privacidade e perfis.
3. Relatórios e documentos oficiais.
4. Desempenho, concorrência e idempotência.
5. Testes ponta a ponta e roteiro de contingência.

## 16. Riscos principais

| Risco | Impacto | Mitigação |
|---|---|---|
| Apresentar regra DEMO como regra oficial | Resultado incorreto e risco jurídico | Parametrização validada por RH, Tributação, Contabilidade e Jurídico. |
| SAGRES sem leiaute oficial confirmado | Remessa inválida | Obter documentação e exemplos oficiais antes da implementação final. |
| Folha sem snapshot | Competência fechada muda após alteração de cadastro | Congelar dados e regras no fechamento. |
| Portal do Contribuinte com perfil interno | Cidadão sem acesso ou acesso indevido | Separar identidade cidadã de RBAC administrativo. |
| Portal da Frota expor dados sensíveis | Risco de segurança e LGPD | Criar política explícita de sanitização/publicação. |
| Dados fixos de Divino | Identidade e regras erradas na POC | Inventário automatizado de ocorrências e revisão manual arquivo por arquivo. |
| Integrações apenas simuladas | Funcionalidade não comprovada | Definir o que será homologado, exportado ou demonstrado em ambiente controlado. |
| Massa inconsistente entre módulos | Documentos e totais não reconciliam | Uma massa única por competência e testes ponta a ponta. |

## 17. Evidências técnicas principais

- Gestão Tributária: `src/lib/tributacao/` e `src/app/app-domain/tributacao/`.
- Portal do Contribuinte: `src/app/portal/tributario/`.
- Folha e parametrizações: `src/app/app-domain/rh/` e `src/lib/rh/payroll-configuration.ts`.
- Portal do Servidor: `src/app/app-domain/portal-servidor/`.
- Gestão de Frota: `src/lib/frotas/`, `src/app/app-domain/frotas/` e `tests/frotas.integration.test.ts`.
- Farmácia: `src/lib/saude/health-stock-service.ts`, `src/lib/saude/health-report-service.ts` e `src/app/app-domain/saude/farmacia/`.
- Documentos: `src/lib/documents/document-flow-service.ts` e `src/app/validar-documento/`.
- Autenticação e permissões: `src/lib/platform/tenant-context.ts`, `src/lib/platform/session.ts` e `src/proxy.ts`.
- Integrações: `src/lib/integrations/registry.ts`.
- Dados e estrutura: `prisma/schema.prisma` e `prisma/migrations/`.

## 18. Definição de pronto para a POC

O projeto estará pronto quando os sete componentes puderem ser demonstrados do início ao fim com dados de Cacimba, sem edição manual de banco, sem referências a Divino e sem depender de valores artificiais não identificados.

Em especial:

- o contracheque deve vir da folha fechada;
- o débito do contribuinte deve vir da Gestão Tributária;
- o abastecimento público deve vir da Gestão de Frota;
- a posição mensal da Farmácia deve resultar dos movimentos reais;
- os três arquivos/remessas SAGRES devem usar a mesma competência demonstrada;
- documentos e relatórios devem ser baixáveis, auditáveis e, quando necessário, verificáveis publicamente.
