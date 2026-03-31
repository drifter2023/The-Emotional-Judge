export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  endpoint: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

function getClientIP(request: Request): string {
  return request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown';
}

export async function checkRateLimit(
  kv: KVNamespace,
  request: Request,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const ip = getClientIP(request);
  const windowId = Math.floor(Date.now() / 1000 / config.windowSeconds);
  const key = `ratelimit:${config.endpoint}:${ip}:${windowId}`;

  const currentStr = await kv.get(key);
  const current = currentStr ? parseInt(currentStr, 10) : 0;

  if (current >= config.maxRequests) {
    const windowEnd = (windowId + 1) * config.windowSeconds;
    const now = Math.floor(Date.now() / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(windowEnd - now, 1),
    };
  }

  await kv.put(key, String(current + 1), {
    expirationTtl: config.windowSeconds + 60,
  });

  return {
    allowed: true,
    remaining: config.maxRequests - current - 1,
    retryAfterSeconds: 0,
  };
}

export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({ success: false, error: '请求过于频繁，请稍后再试' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfterSeconds),
      },
    }
  );
}
