import type { QuizSummary } from "../types/game";
import { apiRequest } from "./http";
import type { QuizDraftPayload } from "../../features/creator/quizDraftValidation";

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

export function updateMyQuiz(quizId: string, payload: QuizDraftPayload, token: string) {
  return apiRequest<QuizSummary>(`/quizzes/${quizId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export function deleteMyQuiz(quizId: string, token: string) {
  return apiRequest<void>(`/quizzes/${quizId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
