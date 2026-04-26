import type { QuizSummary } from "../types/game";
import { apiRequest } from "./http";

export function fetchQuizzes() {
  return apiRequest<QuizSummary[]>("/quizzes");
}
