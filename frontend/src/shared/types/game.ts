export type RoomRoundState = "waiting" | "question_live" | "reveal" | "leaderboard" | "finished";

export type ViewerRoundState = "waiting" | "question_live" | "answer_locked" | "reveal" | "leaderboard" | "finished";

export interface QuizSummary {
  _id: string;
  title: string;
  description: string;
  createdBy: string;
  themeId: string;
  coverEmoji: string;
  visibility: "private" | "public";
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
  status: RoomRoundState;
  currentQuestionIndex: number;
  timerEndsAt: number | null;
  quiz: {
    id: string;
    title: string;
    questionCount: number;
    themeId: string;
    coverEmoji: string;
    visibility: "private" | "public";
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
    avatarId: string;
    score: number;
    correctAnswers: number;
    connected: boolean;
  }>;
  viewerState?: {
    playerId: string;
    roundState: ViewerRoundState;
    selectedOptionId?: string;
    latestQuestionResult?: PlayerRevealPayload;
  };
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
  avatarId?: string;
  score: number;
  correctAnswers: number;
  connected: boolean;
}

export interface QuestionRevealPayload {
  roomPin: string;
  questionIndex: number;
  totalQuestions: number;
  question: {
    id: string;
    prompt: string;
    correctOptionId: string;
    correctOptionText: string;
  };
  distribution: AnswerDistribution[];
  nextStage: "leaderboard" | "finished";
}

export interface PlayerRevealPayload {
  roomPin: string;
  questionId: string;
  playerId: string;
  selectedOptionId?: string;
  selectedOptionText?: string;
  correctOptionId: string;
  correctOptionText: string;
  isCorrect: boolean;
  scoreAwarded: number;
  totalScore: number;
}

export interface LeaderboardPayload {
  roomPin: string;
  questionIndex: number;
  totalQuestions: number;
  leaderboard: LeaderboardEntry[];
  nextQuestionIndex?: number;
}

export interface GameEndPayload extends LeaderboardPayload {
  roomPin: string;
  podium: LeaderboardEntry[];
}
