import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../services/authService.js";
import { HttpError } from "../utils/httpError.js";

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  try {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      throw new HttpError(401, "Authentication required.");
    }

    const token = authorization.slice("Bearer ".length);
    response.locals.userId = verifyToken(token);
    next();
  } catch (error) {
    next(error);
  }
}
