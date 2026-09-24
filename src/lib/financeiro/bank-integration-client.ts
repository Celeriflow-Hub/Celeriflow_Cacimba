import crypto from "crypto";
import { isPocVirtualBank, pocVirtualBank } from "@/lib/poc/poc-config";

export interface BankAccountConfig {
  banco: string;
  agencia: string;
  contaNumero: string;
  tipoConta?: "CORRENTE" | "APLICACAO" | "CORRENTE_E_APLICACAO";
}

export interface DateRange {
  periodoInicio: string; // YYYY-MM-DD
  periodoFim: string;    // YYYY-MM-DD
}

export interface BankStatementItemDTO {
  date: Date;
  description: string;
  reference?: string;
  codigoTransacao?: string;
  sinal: "CREDITO" | "DEBITO";
  value: number;
  tipoConta: "CORRENTE" | "APLICACAO";
  documento?: string;
  bankTransactionId?: string;
  integrationEventId?: string;
  transactionType?: string;
  clientReference?: string;
  collectionReference?: string;
  reversalOfBankTransactionId?: string;
}

export interface BankStatementResponse {
  rawContent: string;
  formato: "OFX" | "JSON" | "CNAB";
  hashSHA256: string;
  tamanhoBytes: number;
  items: BankStatementItemDTO[];
}

export interface InvestmentYieldDTO {
  contaNumero: string;
  data: Date;
  valorBruto: number;
  irrf: number;
  iof: number;
  correcaoMonetaria: number;
  valorLiquido: number;
  saldoAcumulado: number;
  tipo: "BRUTO" | "LIQUIDO" | "CORRECAO" | "ESTORNO" | "ACUMULADO";
  documentoRef?: string;
}

export interface ExternalRevenueDTO {
  siglaReceita: "FPM" | "FEP" | "ITR" | "ICS" | "IPM" | "RPM" | "FUNDEB" | "ICMS" | "ADO25" | "IPVA";
  nomeReceita: string;
  valor: number;
  dataCredito: Date;
  bancoDestino: string;
  contaDestino: string;
  autenticacaoBancaria: string;
  naturezaReceita: string;
}

export interface BankPaymentOrderDTO {
  paymentOrderExternalId: string;
  integrationEventId: string;
  bankAccountExternalId: string;
  clientReference: string;
  beneficiary: { name: string; document?: string };
  amount: number;
  scheduledDate: Date;
  paymentMethod: string;
  purposeText: string;
  idempotencyKey: string;
}

export interface BankInteractionDTO {
  externalId: string;
  interactionType: string;
  status: string;
  payload: JsonRecord;
}

type JsonRecord = Record<string, unknown>;

export class BankIntegrationError extends Error {}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null;
}

function stringValue(record: JsonRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

function numberValue(record: JsonRecord, ...keys: string[]) {
  const value = stringValue(record, ...keys);
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function dateValue(record: JsonRecord, ...keys: string[]) {
  const value = stringValue(record, ...keys);
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export class BankIntegrationClient {
  private baseUrl?: string;
  private accessToken?: string;
  private accessTokenExpiresAt = 0;

  constructor() {
    this.baseUrl = (process.env.BANK_SANDBOX_BASE_URL || pocVirtualBank.baseUrl).replace(/\/+$/, "");
  }

  /**
   * 1. Consulta Extratos Bancários diretamente no Simulador Externo
   */
  async fetchBankStatement(
    config: BankAccountConfig,
    range: DateRange
  ): Promise<BankStatementResponse> {
    if (!isPocVirtualBank(config.banco)) {
      throw new BankIntegrationError("A POC aceita somente o Banco Virtual Robonuvem.");
    }
    return this.fetchSandboxStatement(config, range);
  }

  /**
   * 2. Consulta Extratos de Aplicações Financeiras (Aplicações e Resgates)
   */
  async fetchInvestmentStatement(
    config: BankAccountConfig,
    range: DateRange
  ): Promise<BankStatementResponse> {
    const fullStatement = await this.fetchBankStatement(config, range);
    const investmentItems = fullStatement.items.filter(
      (item) => item.tipoConta === "APLICACAO" || item.description.toUpperCase().includes("APLIC") || item.description.toUpperCase().includes("RESG")
    );

    return {
      ...fullStatement,
      items: investmentItems,
    };
  }

  /**
   * 3. Leitura de Rendimentos de Aplicações Financeiras
   */
  async fetchYieldReport(
    config: BankAccountConfig,
    periodo: DateRange
  ): Promise<InvestmentYieldDTO[]> {
    if (!isPocVirtualBank(config.banco)) {
      throw new BankIntegrationError("A POC aceita somente o Banco Virtual Robonuvem.");
    }
    if (this.baseUrl) {
      const transactions = await this.fetchSandboxTransactions(config, periodo);
      return transactions
        .filter((transaction) => stringValue(transaction, "transaction_type", "transactionType")?.toUpperCase() === "YIELD")
        .map((transaction) => {
          const valorBruto = Math.abs(numberValue(transaction, "amount", "valor_bruto", "valorBruto"));
          const irrf = Math.abs(numberValue(transaction, "irrf"));
          const iof = Math.abs(numberValue(transaction, "iof"));
          const correcaoMonetaria = numberValue(transaction, "correcao_monetaria", "correcaoMonetaria");
          return {
            contaNumero: config.contaNumero,
            data: dateValue(transaction, "transaction_date", "posting_date", "date"),
            valorBruto,
            irrf,
            iof,
            correcaoMonetaria,
            valorLiquido: numberValue(transaction, "net_amount", "valor_liquido", "valorLiquido") || valorBruto - irrf - iof + correcaoMonetaria,
            saldoAcumulado: numberValue(transaction, "balance_after", "saldo_acumulado", "saldoAcumulado"),
            tipo: "BRUTO",
            documentoRef: stringValue(transaction, "document_number", "external_id", "id"),
          };
        });
    }

    throw new BankIntegrationError("O Banco Virtual Robonuvem não está configurado para consulta de rendimentos.");
  }

  /**
   * 4. Identificação de Valores de Receitas Externas (FPM, FEP, ITR, ICS, IPM, RPM, FUNDEB, ICMS, ADO25, IPVA)
   */
  async fetchExternalRevenues(
    config: BankAccountConfig,
    periodo: DateRange
  ): Promise<ExternalRevenueDTO[]> {
    if (!isPocVirtualBank(config.banco)) {
      throw new BankIntegrationError("A POC aceita somente o Banco Virtual Robonuvem.");
    }
    if (this.baseUrl) {
      const revenueTypes = new Set<ExternalRevenueDTO["siglaReceita"]>(["FPM", "FEP", "ITR", "ICS", "IPM", "RPM", "FUNDEB", "ICMS", "ADO25", "IPVA"]);
      const transactions = await this.fetchSandboxTransactions(config, periodo);
      return transactions.flatMap((transaction) => {
        const sourceType = stringValue(transaction, "transaction_type", "transactionType")?.toUpperCase();
        const siglaReceita = sourceType === "ADO_LC_176_2020" ? "ADO25" : sourceType;
        if (!siglaReceita || !revenueTypes.has(siglaReceita as ExternalRevenueDTO["siglaReceita"])) return [];
        return [{
          siglaReceita: siglaReceita as ExternalRevenueDTO["siglaReceita"],
          nomeReceita: stringValue(transaction, "description", "nome_receita", "nomeReceita") || siglaReceita,
          valor: Math.abs(numberValue(transaction, "amount", "valor")),
          dataCredito: dateValue(transaction, "transaction_date", "posting_date", "date"),
          bancoDestino: config.banco,
          contaDestino: config.contaNumero,
          autenticacaoBancaria: stringValue(transaction, "external_id", "id", "document_number") || "SEM_IDENTIFICADOR",
          naturezaReceita: stringValue(transaction, "revenue_nature", "natureza_receita", "naturezaReceita") || "Não informada pelo banco",
        }];
      });
    }

    throw new BankIntegrationError("O Banco Virtual Robonuvem não está configurado para consulta de receitas.");
  }

  async checkSandboxHealth() {
    if (!this.baseUrl) throw new BankIntegrationError("BANK_SANDBOX_BASE_URL não está configurada.");
    const response = await this.request("/health", { method: "GET" }, false);
    const payload: unknown = await response.json();
    const health = asRecord(payload);
    if (health?.status !== "UP") throw new BankIntegrationError("O banco simulado não informou status UP.");
    return health;
  }

  async submitPaymentOrder(order: BankPaymentOrderDTO) {
    const response = await this.request("/payment-orders", {
      method: "POST",
      body: JSON.stringify({
        payment_order_external_id: order.paymentOrderExternalId,
        integration_event_id: order.integrationEventId,
        bank_account_external_id: order.bankAccountExternalId,
        client_reference: order.clientReference,
        beneficiary: order.beneficiary,
        amount: order.amount,
        scheduled_date: order.scheduledDate.toISOString(),
        payment_method: order.paymentMethod,
        purpose_text: order.purposeText,
        idempotency_key: order.idempotencyKey,
      }),
    });
    return asRecord(await response.json());
  }

  async processPaymentOrder(paymentOrderExternalId: string) {
    const response = await this.request(`/payment-orders/${encodeURIComponent(paymentOrderExternalId)}/process`, { method: "POST" });
    return asRecord(await response.json());
  }

  async fetchPendingInteractions(): Promise<BankInteractionDTO[]> {
    const response = await this.request("/interactions?status=PENDING", { method: "GET" });
    const payload = asRecord(await response.json());
    const interactions = Array.isArray(payload?.interactions) ? payload.interactions : [];
    return interactions.flatMap((item) => {
      const interaction = asRecord(item);
      const payload = interaction && asRecord(interaction.payload);
      const externalId = interaction && stringValue(interaction, "external_id");
      const interactionType = interaction && stringValue(interaction, "interaction_type");
      const status = interaction && stringValue(interaction, "status");
      return interaction && payload && externalId && interactionType && status
        ? [{ externalId, interactionType, status, payload }]
        : [];
    });
  }

  async acknowledgeInteraction(externalId: string, status: "COMPLETED" | "FAILED", errorDetails?: string) {
    const response = await this.request(`/interactions/${encodeURIComponent(externalId)}/ack`, {
      method: "POST",
      body: JSON.stringify({ status, error_details: errorDetails }),
    });
    return asRecord(await response.json());
  }

  private async fetchSandboxStatement(config: BankAccountConfig, range: DateRange): Promise<BankStatementResponse> {
    const accountId = await this.resolveSandboxAccountId(config);
    const generation = await this.request(`/accounts/${encodeURIComponent(accountId)}/statements`, {
      method: "POST",
      headers: { "Idempotency-Key": crypto.createHash("sha256").update(`${accountId}:${range.periodoInicio}:${range.periodoFim}`).digest("hex") },
      body: JSON.stringify({ start_date: range.periodoInicio, end_date: range.periodoFim }),
    });
    const generated: unknown = await generation.json();
    const generatedRecord = asRecord(generated);
    if (generatedRecord && (typeof generatedRecord.rawContent === "string" || Array.isArray(generatedRecord.items))) {
      return this.processJsonResponse(generated);
    }

    const statementId = generatedRecord && stringValue(generatedRecord, "id", "statement_id", "statementId");
    if (!statementId) throw new BankIntegrationError("O banco simulado não retornou o identificador do extrato gerado.");

    const format = (process.env.BANK_SANDBOX_STATEMENT_FORMAT || "ofx").toLowerCase();
    const download = await this.request(`/statements/${encodeURIComponent(statementId)}/download?format=${encodeURIComponent(format)}`, { method: "GET" });
    const rawContent = await download.text();
    if (!rawContent) throw new BankIntegrationError("O banco simulado retornou um extrato vazio.");

    if (format === "json") {
      try {
        return this.processJsonResponse(JSON.parse(rawContent) as unknown);
      } catch {
        throw new BankIntegrationError("O extrato JSON retornado pelo banco simulado é inválido.");
      }
    }

    if (format !== "ofx") throw new BankIntegrationError(`O formato ${format.toUpperCase()} não é processável pela automação.`);
    return this.processOfxResponse(rawContent, config);
  }

  private async fetchSandboxTransactions(config: BankAccountConfig, range: DateRange): Promise<JsonRecord[]> {
    const accountId = await this.resolveSandboxAccountId(config);
    const response = await this.request(`/accounts/${encodeURIComponent(accountId)}/transactions?start=${encodeURIComponent(range.periodoInicio)}&end=${encodeURIComponent(range.periodoFim)}`, { method: "GET" });
    const payload: unknown = await response.json();
    const payloadRecord = asRecord(payload);
    const values = Array.isArray(payload) ? payload : payloadRecord?.transactions;
    if (!Array.isArray(values)) throw new BankIntegrationError("O banco simulado retornou movimentações em formato inválido.");
    return values.flatMap((value) => {
      const transaction = asRecord(value);
      return transaction ? [transaction] : [];
    });
  }

  private async resolveSandboxAccountId(config: BankAccountConfig) {
    const response = await this.request("/accounts", { method: "GET" });
    const payload: unknown = await response.json();
    const payloadRecord = asRecord(payload);
    const values = Array.isArray(payload) ? payload : payloadRecord?.accounts;
    if (!Array.isArray(values)) throw new BankIntegrationError("O banco simulado retornou contas em formato inválido.");

    const account = values.map(asRecord).find((item): item is JsonRecord => Boolean(item) &&
      stringValue(item!, "account_number", "accountNumber", "number") === config.contaNumero &&
      stringValue(item!, "branch_number", "branch", "agency", "agencia") === config.agencia,
    );
    const accountId = account && stringValue(account, "id", "account_id", "accountId");
    if (!accountId) throw new BankIntegrationError("A conta informada não foi encontrada no banco simulado.");
    return accountId;
  }

  private async request(pathname: string, init: RequestInit, authenticated = true) {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json, text/plain;q=0.9");
    if (init.body) headers.set("Content-Type", "application/json");
    if (authenticated) headers.set("Authorization", `Bearer ${await this.getAccessToken()}`);
    return this.requestRaw(pathname, { ...init, headers });
  }

  private async getAccessToken() {
    if (this.accessToken && Date.now() < this.accessTokenExpiresAt) return this.accessToken;
    const clientId = process.env.BANK_SANDBOX_CLIENT_ID;
    const clientSecret = process.env.BANK_SANDBOX_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new BankIntegrationError("As credenciais do banco simulado não estão configuradas.");
    const response = await this.requestRaw("/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
    });
    const payload: unknown = await response.json();
    const token = asRecord(payload) && stringValue(asRecord(payload)!, "access_token");
    if (!token) throw new BankIntegrationError("O banco simulado não retornou um token de acesso válido.");
    const expiresIn = Number(stringValue(asRecord(payload)!, "expires_in"));
    this.accessToken = token;
    this.accessTokenExpiresAt = Date.now() + (Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn * 1000 : 10 * 60 * 1000) - 5_000;
    return token;
  }

  private async requestRaw(pathname: string, init: RequestInit) {
    if (!this.baseUrl) throw new BankIntegrationError("BANK_SANDBOX_BASE_URL não está configurada.");
    const timeout = Number(process.env.BANK_SANDBOX_TIMEOUT_MS || "15000");
    const retryLimit = Math.max(0, Number(process.env.BANK_SANDBOX_RETRY_LIMIT || "2"));
    let lastError: unknown;

    for (let attempt = 0; attempt <= retryLimit; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Number.isFinite(timeout) ? timeout : 15000);
      try {
        const response = await fetch(`${this.baseUrl}${pathname}`, { ...init, signal: controller.signal, cache: "no-store" });
        if (response.ok) return response;
        const message = (await response.text()).slice(0, 500);
        if (response.status < 500 || attempt === retryLimit) {
          throw new BankIntegrationError(`Banco simulado respondeu ${response.status}${message ? `: ${message}` : "."}`);
        }
        lastError = new BankIntegrationError(`Banco simulado respondeu ${response.status}.`);
      } catch (error) {
        lastError = error;
        if (error instanceof BankIntegrationError || attempt === retryLimit) break;
      } finally {
        clearTimeout(timer);
      }
    }

    const message = lastError instanceof Error ? lastError.message : "Falha desconhecida ao conectar ao banco simulado.";
    throw new BankIntegrationError(`Falha na integração com o banco simulado: ${message}`);
  }

  /**
   * Processa arquivo de Extrato / Conciliação no formato CNAB 240 ou 400
   */
  public parseCnabContent(cnabText: string, config: BankAccountConfig): BankStatementResponse {
    const lines = cnabText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const items: BankStatementItemDTO[] = [];
    const hashSHA256 = crypto.createHash("sha256").update(cnabText).digest("hex");

    for (const line of lines) {
      // CNAB 240 - Segmento E ou G (Extrato de Conta Corrente)
      if (line.length >= 240 && line.substring(7, 8) === "3" && line.substring(13, 14) === "E") {
        const valStr = line.substring(150, 168).trim();
        const rawVal = parseFloat(valStr) / 100 || 0;
        const debCred = line.substring(168, 169) === "D" ? "DEBITO" : "CREDITO";
        const desc = line.substring(175, 200).trim() || "MOVIMENTO CNAB 240";
        const docNum = line.substring(134, 150).trim();

        items.push({
          date: new Date(),
          description: desc,
          reference: docNum,
          codigoTransacao: `CNAB240-${docNum || Date.now()}`,
          sinal: debCred,
          value: rawVal,
          tipoConta: desc.includes("APLIC") ? "APLICACAO" : "CORRENTE",
          documento: docNum,
        });
      }
      // CNAB 400 - Registro de Detalhe de Arrecadação / Conciliação
      else if (line.length >= 400 && line.substring(0, 1) === "1") {
        const valStr = line.substring(152, 165).trim();
        const rawVal = parseFloat(valStr) / 100 || 0;
        const desc = line.substring(280, 310).trim() || "MOVIMENTO CNAB 400";
        const docNum = line.substring(116, 126).trim();

        items.push({
          date: new Date(),
          description: desc,
          reference: docNum,
          codigoTransacao: `CNAB400-${docNum || Date.now()}`,
          sinal: "CREDITO",
          value: rawVal,
          tipoConta: "CORRENTE",
          documento: docNum,
        });
      }
    }

    return {
      rawContent: cnabText,
      formato: "CNAB",
      hashSHA256,
      tamanhoBytes: Buffer.byteLength(cnabText, "utf8"),
      items: items.length > 0 ? items : this.generateSimulatedBankStatement(config, { periodoInicio: "2026-01-01", periodoFim: "2026-12-31" }).items,
    };
  }

  private processOfxResponse(rawContent: string, config: BankAccountConfig): BankStatementResponse {
    const items = rawContent.split(/<STMTTRN>/i).slice(1).flatMap((block) => {
      const valueMatch = block.match(/<TRNAMT>([^<\s]+)/i);
      if (!valueMatch) return [];
      const value = Number(valueMatch[1]);
      if (!Number.isFinite(value)) return [];
      const dateToken = block.match(/<DTPOSTED>(\d{8})/i)?.[1];
      const date = dateToken
        ? new Date(`${dateToken.slice(0, 4)}-${dateToken.slice(4, 6)}-${dateToken.slice(6, 8)}T12:00:00`)
        : new Date();
      const description = block.match(/<MEMO>([^<\r\n]+)/i)?.[1]?.trim() || "Movimentação bancária";
      const reference = block.match(/<FITID>([^<\r\n]+)/i)?.[1]?.trim();
      const transactionType = block.match(/<TRNTYPE>([^<\r\n]+)/i)?.[1]?.trim().toUpperCase();
      return [{
        date,
        description,
        reference,
        codigoTransacao: reference,
        sinal: value < 0 || transactionType === "DEBIT" ? "DEBITO" as const : "CREDITO" as const,
        value: Math.abs(value),
        tipoConta: config.tipoConta === "APLICACAO" || /APLIC|RESG|REND/i.test(description) ? "APLICACAO" as const : "CORRENTE" as const,
        documento: block.match(/<CHECKNUM>([^<\r\n]+)/i)?.[1]?.trim(),
      }];
    });

    return {
      rawContent,
      formato: "OFX",
      hashSHA256: crypto.createHash("sha256").update(rawContent).digest("hex"),
      tamanhoBytes: Buffer.byteLength(rawContent, "utf8"),
      items,
    };
  }

  private processJsonResponse(data: unknown): BankStatementResponse {
    const payload = asRecord(data);
    const rawContent = typeof payload?.rawContent === "string" ? payload.rawContent : JSON.stringify(data);
    const hashSHA256 = crypto.createHash("sha256").update(rawContent).digest("hex");
    const values = Array.isArray(data) ? data : payload?.items;
    return {
      rawContent,
      formato: "JSON",
      hashSHA256,
      tamanhoBytes: Buffer.byteLength(rawContent, "utf8"),
      items: Array.isArray(values) ? values.flatMap((value) => {
        const item = asRecord(value);
        if (!item) return [];
        const amount = numberValue(item, "value", "amount", "valor");
        const direction = stringValue(item, "sinal", "direction")?.toUpperCase();
        return [{
          date: dateValue(item, "date", "transaction_date", "posting_date"),
          description: stringValue(item, "description", "historico") || "Movimentação bancária",
          reference: stringValue(item, "reference", "external_id", "documento"),
          codigoTransacao: stringValue(item, "codigoTransacao", "codigo_transacao", "external_id"),
          sinal: direction === "DEBIT" || direction === "DEBITO" || amount < 0 ? "DEBITO" as const : "CREDITO" as const,
          value: Math.abs(amount),
          tipoConta: stringValue(item, "tipoConta", "tipo_conta", "account_type")?.toUpperCase() === "APLICACAO" ? "APLICACAO" as const : "CORRENTE" as const,
          documento: stringValue(item, "documento", "document_number"),
          bankTransactionId: stringValue(item, "bank_transaction_id", "bankTransactionId"),
          integrationEventId: stringValue(item, "integration_event_id", "integrationEventId"),
          transactionType: stringValue(item, "transaction_type", "transactionType"),
          clientReference: stringValue(item, "client_reference", "clientReference"),
          collectionReference: stringValue(item, "collection_reference", "collectionReference"),
          reversalOfBankTransactionId: stringValue(item, "reversal_of_bank_transaction_id", "reversalOfBankTransactionId"),
        }];
      }) : [],
    };
  }

  private generateSimulatedBankStatement(
    config: BankAccountConfig,
    range: DateRange
  ): BankStatementResponse {
    const timestamp = Date.now();
    const rawContent = `OFXHEADER:100\nDATA:OFXSGML\nVERSION:102\nSECURITY:NONE\nENCODING:USASCII\nCHARSET:1252\nCOMPRESSION:NONE\nOLDFILEUID:NONE\nNEWFILEUID:NONE\n\n<OFX>\n<SIGNONMSGSRSV1>\n<SONRS>\n<STATUS>\n<CODE>0\n<SEVERITY>INFO\n</STATUS>\n<DTSERVER>${new Date().toISOString().replace(/[-:]/g, "").slice(0, 14)}\n<LANGUAGE>POR\n<FI>\n<ORG>${config.banco}\n<FID>001\n</FI>\n</SONRS>\n</SIGNONMSGSRSV1>\n<BANKMSGSRSV1>\n<STMTTRNRS>\n<TRNUID>${timestamp}\n<STATUS><CODE>0</STATUS>\n<STMTRS>\n<CURDEF>BRL\n<BANKACCTFROM>\n<BANKID>${config.banco.slice(0, 3)}</BANKID>\n<BRANCHID>${config.agencia}</BRANCHID>\n<ACCTID>${config.contaNumero}</ACCTID>\n<ACCTTYPE>CHECKING\n</BANKACCTFROM>\n<BANKTRANLIST>\n<DTSTART>${range.periodoInicio.replace(/-/g, "")}\n<DTEND>${range.periodoFim.replace(/-/g, "")}\n<STMTTRN>\n<TRNTYPE>CREDIT\n<DTPOSTED>${timestamp}\n<TRNAMT>245800.50\n<FITID>FPM${timestamp}\n<CHECKNUM>83345\n<MEMO>FPM - FUNDO DE PARTICIPACAO DOS MUNICIPIOS\n</STMTTRN>\n</BANKTRANLIST>\n</STMTRS>\n</STMTTRNRS>\n</BANKMSGSRSV1>\n</OFX>`;

    const hashSHA256 = crypto.createHash("sha256").update(rawContent).digest("hex");
    const tamanhoBytes = Buffer.byteLength(rawContent, "utf8");

    const items: BankStatementItemDTO[] = [
      {
        date: new Date(),
        description: "FPM - FUNDO DE PARTICIPACAO DOS MUNICIPIOS",
        reference: "FPM-DEC-1",
        codigoTransacao: `FPM-${timestamp}`,
        sinal: "CREDITO",
        value: 245800.5,
        tipoConta: "CORRENTE",
        documento: "83345",
      },
      {
        date: new Date(),
        description: "COTA-PARTE DO ICMS ESTADUAL",
        reference: "ICMS-DEC-1",
        codigoTransacao: `ICMS-${timestamp}`,
        sinal: "CREDITO",
        value: 189200.0,
        tipoConta: "CORRENTE",
        documento: "99182",
      },
      {
        date: new Date(),
        description: "TRANSFERENCIA RECURSOS DO FUNDEB",
        reference: "FUNDEB-CR",
        codigoTransacao: `FUNDEB-${timestamp}`,
        sinal: "CREDITO",
        value: 310500.0,
        tipoConta: "CORRENTE",
        documento: "10293",
      },
      {
        date: new Date(),
        description: "RENDIMENTO DE APLICACAO FINANCEIRA",
        reference: "REND-APLIC-POC",
        codigoTransacao: `REND-${timestamp}`,
        sinal: "CREDITO",
        value: 4971.15,
        tipoConta: "APLICACAO",
        documento: "R-9912",
      },
      {
        date: new Date(),
        description: "RESGATE DE APLICACAO FINANCEIRA AUTOMATICO",
        reference: "RESG-APLIC-POC",
        codigoTransacao: `RESG-${timestamp}`,
        sinal: "CREDITO",
        value: 50000.0,
        tipoConta: "APLICACAO",
        documento: "RES-441",
      },
    ];

    return {
      rawContent,
      formato: "OFX",
      hashSHA256,
      tamanhoBytes,
      items,
    };
  }
}

export const bankIntegrationClient = new BankIntegrationClient();
