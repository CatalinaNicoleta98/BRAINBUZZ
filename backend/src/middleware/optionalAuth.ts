import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../services/authService.js";

export function optionalAuth(request: Request, response: Response, next: NextFunction) {
  try {
    const authorization = request.headers.authorization;
    if (authorization?.startsWith("Bearer ")) {
      const token = authorization.slice("Bearer ".length);
      response.locals.userId = verifyToken(token);
    }

    next();
  } catch (error) {
    next(error);
  }
}
