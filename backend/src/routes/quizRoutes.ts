import { Router } from "express";
import { createQuizController, getQuizController, listQuizzesController } from "../controllers/quizController.js";

const quizRouter = Router();

quizRouter.get("/", listQuizzesController);
quizRouter.get("/:quizId", getQuizController);
quizRouter.post("/", createQuizController);

export { quizRouter };
