import { Router } from "express";
import { loginController, meController, registerController } from "../controllers/authController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const authRouter = Router();

authRouter.post("/register", registerController);
authRouter.post("/login", loginController);
authRouter.get("/me", requireAuth, meController);

export { authRouter };
