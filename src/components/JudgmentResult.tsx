import Gauge from './Gauge';

interface JudgmentResultProps {
  score: number;
  verdict: string;
  analysis: string;
  onReset: () => void;
}

export default function JudgmentResult({ score, verdict, analysis, onReset }: JudgmentResultProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-8 animate-slide-up">
      {/* Gauge with animated score */}
      <div className="mb-6">
        <Gauge value={score} />
      </div>

      {/* Verdict */}
      <h2 className="text-2xl font-bold text-judge-gold mb-6 text-center">
        {verdict}
      </h2>

      {/* Analysis */}
      <div className="glass-card w-full p-6 mb-8">
        {analysis.split('\n').map((paragraph, i) => (
          <p key={i} className={`text-slate-300 text-sm leading-relaxed ${i > 0 ? 'mt-3' : ''}`}>
            {paragraph}
          </p>
        ))}
      </div>

      {/* Reset button */}
      <button
        onClick={onReset}
        className="px-8 py-3 rounded-xl border border-judge-gold/40 text-judge-gold font-medium
                   hover:bg-judge-gold/10 transition-colors
                   active:scale-[0.98] transform"
      >
        再审一次
      </button>
    </div>
  );
}
