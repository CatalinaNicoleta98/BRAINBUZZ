import type { QuizSummary } from "../types/game";
import { apiRequest } from "./http";

export function fetchQuizzes() {
  return apiRequest<QuizSummary[]>("/quizzes");
}

export function fetchMyQuizzes(token: string) {
  return apiRequest<QuizSummary[]>("/quizzes/mine", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
