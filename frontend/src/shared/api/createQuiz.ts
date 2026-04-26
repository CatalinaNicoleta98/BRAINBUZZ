import { apiRequest } from "./http";

interface CreateQuizPayload {
  title: string;
  description: string;
  createdBy: string;
  questions: Array<{
    prompt: string;
    options: string[];
    correctOptionIndex: number;
    timeLimitSeconds: number;
    points: number;
  }>;
}

export function createQuiz(payload: CreateQuizPayload) {
  return apiRequest<{ _id: string }>("/quizzes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
