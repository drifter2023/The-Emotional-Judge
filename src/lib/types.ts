export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface FollowupResponse {
  success: true;
  data: {
    type: 'followup';
    message: string;
  };
}

export interface JudgmentResponse {
  success: true;
  data: {
    type: 'judgment';
    score: number;
    verdict: string;
    analysis: string;
  };
}

export type JudgeResponse = FollowupResponse | JudgmentResponse;

export interface RedeemResponse {
  success: boolean;
  error?: string;
  data?: {
    type: string;
    totalCredits: number;
    usedCredits: number;
    remaining: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
}
