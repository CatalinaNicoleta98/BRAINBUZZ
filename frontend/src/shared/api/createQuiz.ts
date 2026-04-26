import { apiRequest } from "./http";

interface CreateQuizPayload {
  title: string;
  description: string;
  createdBy: string;
  themeId: string;
  coverEmoji: string;
  visibility: "private" | "public";
  questions: Array<{
    prompt: string;
    options: string[];
    correctOptionIndex: number;
    timeLimitSeconds: number;
    points: number;
  }>;
}

export function createQuiz(payload: CreateQuizPayload, token: string) {
  return apiRequest<{ _id: string }>("/quizzes", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}
