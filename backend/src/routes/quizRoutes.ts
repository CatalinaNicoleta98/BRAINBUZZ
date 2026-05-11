import { Router } from "express";
import {
  createQuizController,
  deleteQuizController,
  getQuizController,
  listCreatorLibraryController,
  listQuizzesController,
  updateQuizController,
} from "../controllers/quizController.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import { requireAuth } from "../middleware/requireAuth.js";

const quizRouter = Router();

quizRouter.get("/", optionalAuth, listQuizzesController);
quizRouter.get("/mine", requireAuth, listCreatorLibraryController);
quizRouter.get("/:quizId", getQuizController);
quizRouter.post("/", requireAuth, createQuizController);
quizRouter.put("/:quizId", requireAuth, updateQuizController);
quizRouter.delete("/:quizId", requireAuth, deleteQuizController);

export { quizRouter };
