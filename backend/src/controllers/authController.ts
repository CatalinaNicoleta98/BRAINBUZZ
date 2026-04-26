import { NextFunction, Request, Response } from "express";
import { getUserProfile, loginUser, registerUser } from "../services/authService.js";

export async function registerController(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(201).json(await registerUser(request.body));
  } catch (error) {
    next(error);
  }
}

export async function loginController(request: Request, response: Response, next: NextFunction) {
  try {
    response.json(await loginUser(request.body));
  } catch (error) {
    next(error);
  }
}

export async function meController(request: Request, response: Response, next: NextFunction) {
  try {
    response.json(await getUserProfile(response.locals.userId as string));
  } catch (error) {
    next(error);
  }
}
