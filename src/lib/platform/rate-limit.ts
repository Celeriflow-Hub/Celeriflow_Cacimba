// Rate limiting simples usando Map em memória.
// Para produção com múltiplas instâncias, substituir por Upstash Redis.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000; // 1 minuto
const MAX_ATTEMPTS = 10;  // 10 tentativas por IP por minuto

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count++;
  return { allowed: true };
}
