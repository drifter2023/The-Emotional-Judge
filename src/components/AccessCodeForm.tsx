import { useEffect, useState } from 'react';
import { redeemCode } from '../lib/api';

interface AccessCodeFormProps {
  onAuthenticated: (code: string) => void;
}

export default function AccessCodeForm({ onAuthenticated }: AccessCodeFormProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check localStorage first
    const savedCode = localStorage.getItem('judge_code');
    if (savedCode) {
      onAuthenticated(savedCode);
      return;
    }

    // Check URL param
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('code');
    if (urlCode) {
      handleRedeem(urlCode.trim());
    } else {
      setChecking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRedeem(codeValue: string) {
    setLoading(true);
    setError('');
    try {
      const res = await redeemCode(codeValue);
      if (res.success) {
        localStorage.setItem('judge_code', codeValue);
        onAuthenticated(codeValue);
      } else {
        setError(res.error || '无效的兑换码');
        setChecking(false);
      }
    } catch {
      setError('网络错误，请稍后重试');
      setChecking(false);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setError('请输入兑换码');
      return;
    }
    handleRedeem(trimmed);
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-400 text-sm animate-pulse">验证中...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <h1 className="text-4xl font-extrabold text-judge-gold mb-3 tracking-tight">
        <span className="mr-2">&#x2696;&#xFE0F;</span>情感判官AI
      </h1>
      <p className="text-slate-400 text-base mb-10">
        AI帮你判断ta的行为到底有多过分
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError('');
          }}
          placeholder="请输入兑换码"
          className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700
                     text-slate-200 placeholder-slate-500 font-mono tracking-wider
                     focus:outline-none focus:border-judge-gold/60 focus:ring-1 focus:ring-judge-gold/30
                     transition-colors"
          autoComplete="off"
          spellCheck={false}
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-judge-gold text-judge-darker font-semibold text-base
                     hover:bg-judge-gold-light transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed
                     active:scale-[0.98] transform"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              验证中...
            </span>
          ) : (
            '开始审判'
          )}
        </button>

        {error && (
          <p className="text-red-400 text-sm text-center animate-fade-in">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
