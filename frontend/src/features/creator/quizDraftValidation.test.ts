import { describe, expect, it } from "vitest";
import { QUIZ_LIMITS, buildQuizValidationErrors, type QuizDraftPayload } from "./quizDraftValidation";

function buildPayload(overrides: Partial<QuizDraftPayload> = {}): QuizDraftPayload {
  return {
    title: "BrainBuzz Practice Test",
    description: "A valid quiz description for testing the creator publish flow.",
    createdBy: "Kate",
    themeId: "midnight",
    coverEmoji: "🧠",
    visibility: "private",
    questions: [
      {
        prompt: "Which HTTP method is usually used to create a resource?",
        options: ["GET", "POST", "PUT", "PATCH"],
        correctOptionIndex: 1,
        timeLimitSeconds: 15,
        points: 1000,
      },
    ],
    ...overrides,
  };
}

describe("buildQuizValidationErrors", () => {
  it("accepts a valid quiz draft", () => {
    const result = buildQuizValidationErrors(buildPayload());

    expect(result.fieldErrors).toEqual({});
    expect(result.questionErrors).toEqual([]);
  });

  it("flags quiz drafts that exceed the backend question limit", () => {
    const questions = Array.from({ length: QUIZ_LIMITS.questions.max + 1 }, () => buildPayload().questions[0]);
    const result = buildQuizValidationErrors(buildPayload({ questions }));

    expect(result.fieldErrors.questions).toBe(`A quiz can contain up to ${QUIZ_LIMITS.questions.max} questions.`);
  });

  it("flags prompts that are longer than the backend allows", () => {
    const result = buildQuizValidationErrors(
      buildPayload({
        questions: [
          {
            ...buildPayload().questions[0],
            prompt: "x".repeat(QUIZ_LIMITS.prompt.max + 1),
          },
        ],
      }),
    );

    expect(result.questionErrors).toContain(`Question 1 prompt must be ${QUIZ_LIMITS.prompt.max} characters or less.`);
  });
});
