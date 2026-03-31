import { useState } from 'react';
import AccessCodeForm from './components/AccessCodeForm';
import ChatConversation from './components/ChatConversation';
import JudgmentResult from './components/JudgmentResult';

type Screen = 'access-code' | 'conversation' | 'result';

interface Judgment {
  score: number;
  verdict: string;
  analysis: string;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('access-code');
  const [code, setCode] = useState('');
  const [judgment, setJudgment] = useState<Judgment | null>(null);

  function handleAuthenticated(authenticatedCode: string) {
    setCode(authenticatedCode);
    setScreen('conversation');
  }

  function handleJudgment(data: Judgment) {
    setJudgment(data);
    setScreen('result');
  }

  function handleReset() {
    setJudgment(null);
    setScreen('conversation');
  }

  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="w-full max-w-lg px-4">
        {screen === 'access-code' && (
          <AccessCodeForm onAuthenticated={handleAuthenticated} />
        )}

        {screen === 'conversation' && (
          <ChatConversation
            key={judgment === null ? 'fresh' : 'reset'}
            code={code}
            onJudgment={handleJudgment}
          />
        )}

        {screen === 'result' && judgment && (
          <JudgmentResult
            score={judgment.score}
            verdict={judgment.verdict}
            analysis={judgment.analysis}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}
