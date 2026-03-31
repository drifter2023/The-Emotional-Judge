import { checkRateLimit, rateLimitResponse } from '../lib/rate-limit';
import { SYSTEM_PROMPT } from '../lib/prompt';

interface Env {
  JUDGE_CODES: KVNamespace;
  MOONSHOT_API_KEY: string;
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

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface JudgmentData {
  type: 'judgment';
  score: number;
  verdict: string;
  analysis: string;
}

interface FollowupData {
  type: 'followup';
  message: string;
}

const TEST_LINK_CODE = 'TEST-LINK-UNLIMITED';

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Rate limit
    const rateCheck = await checkRateLimit(
      context.env.JUDGE_CODES,
      context.request,
      { endpoint: 'judge', maxRequests: 5, windowSeconds: 60 }
    );
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck);
    }

    const body = (await context.request.json()) as {
      code: string;
      messages: ChatMessage[];
    };
    const { code, messages } = body;

    if (!code || !messages?.length) {
      return jsonResponse({ success: false, error: '缺少必要参数' }, 400);
    }

    // Validate message content
    const lastUserMsg = messages.filter((m) => m.role === 'user').pop();
    if (!lastUserMsg || lastUserMsg.content.length > 2000) {
      return jsonResponse({ success: false, error: '消息内容无效' }, 400);
    }

    // Validate code (skip KV check for test code)
    let isTestCode = false;
    if (code === TEST_LINK_CODE) {
      if (context.env.ENABLE_TEST_LINK !== 'true') {
        return jsonResponse({ success: false, error: '测试链接未启用' }, 403);
      }
      isTestCode = true;
    }

    let record: CodeRecord | null = null;
    if (!isTestCode) {
      const recordStr = await context.env.JUDGE_CODES.get(`code:${code}`);
      if (!recordStr) {
        return jsonResponse({ success: false, error: '兑换码无效' }, 404);
      }
      record = JSON.parse(recordStr);
      if (record!.status !== 'active') {
        return jsonResponse({ success: false, error: '兑换码已过期或已用完' }, 400);
      }
      if (record!.usedCredits >= record!.totalCredits) {
        return jsonResponse({ success: false, error: '次数已用完' }, 400);
      }
    }

    // Build messages for AI
    const aiMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    // Call Moonshot/Kimi API
    const aiResponse = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.env.MOONSHOT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: aiMessages,
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('Moonshot API error:', errText);
      return jsonResponse({ success: false, error: 'AI服务暂时不可用' }, 502);
    }

    const aiResult = (await aiResponse.json()) as {
      choices: { message: { content: string } }[];
    };

    const rawContent = aiResult.choices?.[0]?.message?.content;
    if (!rawContent) {
      return jsonResponse({ success: false, error: 'AI返回为空' }, 502);
    }

    // Parse AI response — strip markdown code fences if present
    let cleaned = rawContent.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    let parsed: JudgmentData | FollowupData;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse AI response:', rawContent);
      return jsonResponse({ success: false, error: '判官思考出了问题，请重试' }, 502);
    }

    // If judgment, deduct credit
    if (parsed.type === 'judgment' && record && !isTestCode) {
      record.usedCredits += 1;
      record.lastUsedAt = new Date().toISOString();
      if (record.usedCredits >= record.totalCredits) {
        record.status = 'used';
      }
      await context.env.JUDGE_CODES.put(`code:${code}`, JSON.stringify(record));
    }

    return jsonResponse({ success: true, data: parsed });
  } catch (err) {
    console.error('Judge error:', err);
    return jsonResponse({ success: false, error: '服务器错误' }, 500);
  }
};
