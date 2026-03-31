import { useEffect, useRef, useState } from 'react';
import { sendMessage } from '../lib/api';
import type { ChatMessage } from '../lib/types';
import Gauge from './Gauge';

interface ChatConversationProps {
  code: string;
  onJudgment: (data: { score: number; verdict: string; analysis: string }) => void;
}

const INITIAL_GREETING = '你好，我是情感判官。请告诉我，ta做了什么让你不舒服的事情？';

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatConversation({ code, onJudgment }: ChatConversationProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([
    { role: 'assistant', content: INITIAL_GREETING },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: DisplayMessage = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Build API messages: exclude the initial hardcoded greeting
      const apiMessages: ChatMessage[] = updatedMessages
        .slice(1) // skip the initial greeting
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await sendMessage(code, apiMessages);
      const { data } = response;

      if (data.type === 'followup') {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.message },
        ]);
      } else if (data.type === 'judgment') {
        onJudgment({
          score: data.score,
          verdict: data.verdict,
          analysis: data.analysis,
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '发送失败，请重试';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `[错误] ${errorMsg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] animate-fade-in">
      {/* Gauge at top */}
      <div className="flex-shrink-0 pt-4 pb-2">
        <Gauge value={50} loading />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="chat-bubble-ai px-4 py-3 text-sm">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 p-3 border-t border-slate-800/50">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="说说发生了什么..."
            rows={1}
            disabled={loading}
            className="flex-1 resize-none px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700
                       text-slate-200 placeholder-slate-500 text-sm
                       focus:outline-none focus:border-judge-gold/60 focus:ring-1 focus:ring-judge-gold/30
                       transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 p-2.5 rounded-xl bg-judge-gold text-judge-darker
                       hover:bg-judge-gold-light transition-colors
                       disabled:opacity-30 disabled:cursor-not-allowed
                       active:scale-95 transform"
            aria-label="发送"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
