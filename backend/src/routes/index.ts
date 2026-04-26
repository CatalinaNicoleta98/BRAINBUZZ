import { Router } from "express";
import { quizRouter } from "./quizRoutes.js";

const apiRouter = Router();

apiRouter.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

apiRouter.use("/quizzes", quizRouter);

export { apiRouter };
