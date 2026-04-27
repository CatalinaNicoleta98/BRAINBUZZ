import { Router } from "express";
import {
  createQuizController,
  getQuizController,
  listCreatorLibraryController,
  listQuizzesController,
} from "../controllers/quizController.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import { requireAuth } from "../middleware/requireAuth.js";

const quizRouter = Router();

quizRouter.get("/", optionalAuth, listQuizzesController);
quizRouter.get("/mine", requireAuth, listCreatorLibraryController);
quizRouter.get("/:quizId", getQuizController);
quizRouter.post("/", requireAuth, createQuizController);

export { quizRouter };
