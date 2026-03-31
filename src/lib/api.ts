import type { ChatMessage, JudgeResponse, RedeemResponse } from './types';

export async function redeemCode(code: string): Promise<RedeemResponse> {
  const res = await fetch('/api/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: code.trim() }),
  });
  return res.json();
}

export async function sendMessage(
  code: string,
  messages: ChatMessage[]
): Promise<JudgeResponse> {
  const res = await fetch('/api/judge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, messages }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '服务器错误');
  }
  return res.json();
}
