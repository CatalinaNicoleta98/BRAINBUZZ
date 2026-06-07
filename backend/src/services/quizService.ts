import { z } from "zod";
import { QuizModel } from "../models/Quiz.js";
import { createId } from "../utils/createId.js";
import { HttpError } from "../utils/httpError.js";

const quizPayloadSchema = z.object({
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().min(10).max(240),
  createdBy: z.string().trim().min(2).max(40),
  themeId: z.string().min(3).max(40).default("midnight"),
  coverEmoji: z.string().trim().min(1).max(8).default("🧠"),
  visibility: z.enum(["private", "public"]).default("private"),
  questions: z
    .array(
      z.object({
        prompt: z.string().trim().min(5).max(180),
        options: z.array(z.string().trim().min(1).max(120)).min(2).max(6),
        correctOptionIndex: z.number().int().min(0),
        timeLimitSeconds: z.number().int().min(5).max(60),
        points: z.number().int().min(100).max(5000),
      }),
    )
    .min(1)
    .max(20),
});

export type CreateQuizInput = z.infer<typeof quizPayloadSchema>;

function isQuizOwner(quiz: { ownerId?: { toString(): string } | null }, userId?: string) {
  return Boolean(userId && quiz.ownerId?.toString() === userId);
}

function canAccessQuiz(quiz: { visibility: "private" | "public"; ownerId?: { toString(): string } | null }, userId?: string) {
  return quiz.visibility === "public" || isQuizOwner(quiz, userId);
}

function toQuizSummary(
  quiz: {
    _id: { toString(): string };
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
  },
  options?: { includeAnswers?: boolean },
) {
  return {
    _id: quiz._id.toString(),
    title: quiz.title,
    description: quiz.description,
    createdBy: quiz.createdBy,
    themeId: quiz.themeId,
    coverEmoji: quiz.coverEmoji,
    visibility: quiz.visibility,
    questions: quiz.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      options: question.options.map((option) => ({
        id: option.id,
        text: option.text,
      })),
      correctOptionId: options?.includeAnswers ? question.correctOptionId : undefined,
      timeLimitSeconds: question.timeLimitSeconds,
      points: question.points,
    })),
  };
}

function buildQuestions(parsed: CreateQuizInput) {
  return parsed.questions.map((question) => {
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
}

export async function createQuiz(input: CreateQuizInput, ownerId?: string) {
  const parsed = quizPayloadSchema.parse(input);
  const questions = buildQuestions(parsed);

  const quiz = await QuizModel.create({
    title: parsed.title,
    description: parsed.description,
    createdBy: parsed.createdBy,
    ownerId,
    themeId: parsed.themeId,
    coverEmoji: parsed.coverEmoji,
    visibility: ownerId ? parsed.visibility : "public",
    questions,
  });

  return toQuizSummary(quiz, { includeAnswers: true });
}

async function getOwnedQuizOrThrow(quizId: string, ownerId: string) {
  const quiz = await QuizModel.findById(quizId);
  if (!quiz) {
    throw new HttpError(404, "Quiz not found.");
  }

  if (quiz.ownerId?.toString() !== ownerId) {
    throw new HttpError(403, "You can only manage quizzes from your own library.");
  }

  return quiz;
}

export async function updateQuiz(quizId: string, input: CreateQuizInput, ownerId: string) {
  const parsed = quizPayloadSchema.parse(input);
  const questions = buildQuestions(parsed);
  const quiz = await getOwnedQuizOrThrow(quizId, ownerId);

  quiz.set({
    title: parsed.title,
    description: parsed.description,
    createdBy: parsed.createdBy,
    themeId: parsed.themeId,
    coverEmoji: parsed.coverEmoji,
    visibility: parsed.visibility,
    questions,
  });

  await quiz.save();
  return toQuizSummary(quiz, { includeAnswers: true });
}

export async function deleteQuiz(quizId: string, ownerId: string) {
  const quiz = await getOwnedQuizOrThrow(quizId, ownerId);
  await quiz.deleteOne();
}

export async function listQuizzes(userId?: string) {
  const query = userId
    ? { $or: [{ visibility: "public" }, { ownerId: userId }] }
    : { visibility: "public" };

  const quizzes = await QuizModel.find(query).sort({ createdAt: -1 }).lean();
  return quizzes.map((quiz) => toQuizSummary(quiz));
}

export async function getQuizById(quizId: string, userId?: string) {
  const quiz = await QuizModel.findById(quizId).lean();
  if (!quiz) {
    return null;
  }

  if (!canAccessQuiz(quiz, userId)) {
    throw new HttpError(403, "You are not allowed to access that private quiz.");
  }

  return toQuizSummary(quiz, { includeAnswers: isQuizOwner(quiz, userId) });
}

export async function listMyQuizzes(userId: string) {
  const quizzes = await QuizModel.find({ ownerId: userId }).sort({ updatedAt: -1 }).lean();
  return quizzes.map((quiz) => toQuizSummary(quiz, { includeAnswers: true }));
}
