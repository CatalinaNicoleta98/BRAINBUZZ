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
  const normalizedPayload: CreateQuizPayload = {
    title: payload.title,
    description: payload.description,
    createdBy: payload.createdBy,
    themeId: payload.themeId,
    coverEmoji: payload.coverEmoji,
    visibility: payload.visibility,
    questions: payload.questions.map((question) => ({
      prompt: question.prompt,
      options: [...question.options],
      correctOptionIndex: question.correctOptionIndex,
      timeLimitSeconds: question.timeLimitSeconds,
      points: question.points,
    })),
  };

  return apiRequest<{ _id: string }>("/quizzes", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(normalizedPayload),
  });
}
