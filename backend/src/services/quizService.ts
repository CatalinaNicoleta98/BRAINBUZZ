import { z } from "zod";
import { QuizModel } from "../models/Quiz.js";
import { createId } from "../utils/createId.js";
import { HttpError } from "../utils/httpError.js";

const quizPayloadSchema = z.object({
  title: z.string().min(3).max(80),
  description: z.string().min(10).max(240),
  createdBy: z.string().min(2).max(40),
  questions: z
    .array(
      z.object({
        prompt: z.string().min(5).max(180),
        options: z.array(z.string().min(1).max(120)).min(2).max(6),
        correctOptionIndex: z.number().int().min(0),
        timeLimitSeconds: z.number().int().min(5).max(60),
        points: z.number().int().min(100).max(5000),
      }),
    )
    .min(1)
    .max(20),
});

export type CreateQuizInput = z.infer<typeof quizPayloadSchema>;

export async function createQuiz(input: CreateQuizInput) {
  const parsed = quizPayloadSchema.parse(input);

  const questions = parsed.questions.map((question) => {
    if (question.correctOptionIndex >= question.options.length) {
      throw new HttpError(400, "Correct option index is out of range.");
    }

    const optionIds = question.options.map(() => createId("option"));
    return {
      id: createId("question"),
      prompt: question.prompt,
      options: question.options.map((text, index) => ({
        id: optionIds[index],
        text,
      })),
      correctOptionId: optionIds[question.correctOptionIndex],
      timeLimitSeconds: question.timeLimitSeconds,
      points: question.points,
    };
  });

  return QuizModel.create({
    title: parsed.title,
    description: parsed.description,
    createdBy: parsed.createdBy,
    questions,
  });
}

export async function listQuizzes() {
  return QuizModel.find().sort({ createdAt: -1 }).lean();
}

export async function getQuizById(quizId: string) {
  return QuizModel.findById(quizId).lean();
}
