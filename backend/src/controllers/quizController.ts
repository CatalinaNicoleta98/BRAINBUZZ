import { NextFunction, Request, Response } from "express";
import { createQuiz, getQuizById, listMyQuizzes, listQuizzes } from "../services/quizService.js";

export async function createQuizController(request: Request, response: Response, next: NextFunction) {
  try {
    const quiz = await createQuiz(request.body, response.locals.userId as string | undefined);
    response.status(201).json(quiz);
  } catch (error) {
    next(error);
  }
}

export async function listQuizzesController(_request: Request, response: Response, next: NextFunction) {
  try {
    const quizzes = await listQuizzes();
    response.json(quizzes);
  } catch (error) {
    next(error);
  }
}

export async function getQuizController(request: Request<{ quizId: string }>, response: Response, next: NextFunction) {
  try {
    const quiz = await getQuizById(request.params.quizId);
    if (!quiz) {
      response.status(404).json({ message: "Quiz not found." });
      return;
    }

    response.json(quiz);
  } catch (error) {
    next(error);
  }
}

export async function listCreatorLibraryController(_request: Request, response: Response, next: NextFunction) {
  try {
    const quizzes = await listMyQuizzes(response.locals.userId as string);
    response.json(quizzes);
  } catch (error) {
    next(error);
  }
}
