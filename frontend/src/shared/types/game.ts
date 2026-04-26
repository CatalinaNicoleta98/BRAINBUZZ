export interface QuizSummary {
  _id: string;
  title: string;
  description: string;
  createdBy: string;
  questions: Array<{
    id: string;
    prompt: string;
    options: Array<{ id: string; text: string }>;
    correctOptionId: string;
    timeLimitSeconds: number;
    points: number;
  }>;
}

export interface RoomState {
  roomPin: string;
  hostName: string;
  status: "lobby" | "question" | "leaderboard" | "finished";
  currentQuestionIndex: number;
  timerEndsAt: number | null;
  quiz: {
    id: string;
    title: string;
    questionCount: number;
  };
  currentQuestion: {
    id?: string;
    prompt?: string;
    options: Array<{ id: string; text: string }>;
    timeLimitSeconds?: number;
    points?: number;
    correctOptionId?: string;
  } | null;
  players: Array<{
    id: string;
    displayName: string;
    score: number;
    correctAnswers: number;
    connected: boolean;
  }>;
}

export interface QuestionShowPayload {
  roomPin: string;
  questionIndex: number;
  totalQuestions: number;
  timerEndsAt: number;
  question: {
    id: string;
    prompt: string;
    options: Array<{ id: string; text: string }>;
    timeLimitSeconds: number;
    points: number;
  };
}

export interface AnswerDistribution {
  optionId: string;
  text: string;
  count: number;
  isCorrect: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  score: number;
  correctAnswers: number;
  connected: boolean;
}
