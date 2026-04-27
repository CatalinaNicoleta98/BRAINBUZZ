import { devQuizLibrary } from "../data/devQuizLibrary.js";
import { QuizModel } from "../models/Quiz.js";
import { createQuiz } from "./quizService.js";

export async function seedQuizLibrary() {
  for (const quiz of devQuizLibrary) {
    const existing = await QuizModel.findOne({ title: quiz.title, createdBy: quiz.createdBy, ownerId: { $exists: false } }).lean();
    if (existing) {
      continue;
    }

    await createQuiz(quiz);
  }
}
