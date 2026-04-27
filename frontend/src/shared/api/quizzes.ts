import type { QuizSummary } from "../types/game";
import { apiRequest } from "./http";

export function fetchQuizzes(token?: string) {
  return apiRequest<QuizSummary[]>("/quizzes", {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });
}

export function fetchMyQuizzes(token: string) {
  return apiRequest<QuizSummary[]>("/quizzes/mine", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
