import { checkRateLimit, rateLimitResponse } from '../lib/rate-limit';

interface Env {
  JUDGE_CODES: KVNamespace;
  ENABLE_TEST_LINK: string;
}

interface CodeRecord {
  type: 'trial' | 'basic' | 'standard';
  totalCredits: number;
  usedCredits: number;
  status: 'active' | 'used' | 'expired';
  createdAt: string;
  lastUsedAt: string | null;
}

const TEST_LINK_CODE = 'TEST-LINK-UNLIMITED';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const rateCheck = await checkRateLimit(
      context.env.JUDGE_CODES,
      context.request,
      { endpoint: 'redeem', maxRequests: 10, windowSeconds: 60 }
    );
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck);
    }

    const body = (await context.request.json()) as { code: string };
    const { code } = body;

    if (!code) {
      return new Response(
        JSON.stringify({ success: false, error: '请输入兑换码' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (code === TEST_LINK_CODE) {
      const enabled = context.env.ENABLE_TEST_LINK === 'true';
      if (!enabled) {
        return new Response(
          JSON.stringify({ success: false, error: '测试链接未启用' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            type: 'test',
            totalCredits: 999,
            usedCredits: 0,
            remaining: 999,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const recordStr = await context.env.JUDGE_CODES.get(`code:${code}`);

    if (!recordStr) {
      return new Response(
        JSON.stringify({ success: false, error: '兑换码无效' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const record: CodeRecord = JSON.parse(recordStr);

    if (record.status !== 'active') {
      return new Response(
        JSON.stringify({ success: false, error: '兑换码已过期或已用完' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const remaining = record.totalCredits - record.usedCredits;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          type: record.type,
          totalCredits: record.totalCredits,
          usedCredits: record.usedCredits,
          remaining,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: '服务器错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
