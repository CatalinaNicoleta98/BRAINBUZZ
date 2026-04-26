import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env.js";
import { UserModel } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";

const registerSchema = z.object({
  displayName: z.string().min(2).max(40),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: "7d" });
}

function mapUser(user: { _id: { toString(): string }; displayName: string; email: string }) {
  return {
    id: user._id.toString(),
    displayName: user.displayName,
    email: user.email,
  };
}

export async function registerUser(input: unknown) {
  const parsed = registerSchema.parse(input);
  const existing = await UserModel.findOne({ email: parsed.email.toLowerCase() }).lean();
  if (existing) {
    throw new HttpError(409, "An account with that email already exists.");
  }

  const passwordHash = await bcrypt.hash(parsed.password, 10);
  const user = await UserModel.create({
    displayName: parsed.displayName,
    email: parsed.email.toLowerCase(),
    passwordHash,
  });

  return {
    token: signToken(user._id.toString()),
    user: mapUser(user),
  };
}

export async function loginUser(input: unknown) {
  const parsed = loginSchema.parse(input);
  const user = await UserModel.findOne({ email: parsed.email.toLowerCase() });
  if (!user) {
    throw new HttpError(401, "Invalid email or password.");
  }

  const valid = await bcrypt.compare(parsed.password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, "Invalid email or password.");
  }

  return {
    token: signToken(user._id.toString()),
    user: mapUser(user),
  };
}

export async function getUserProfile(userId: string) {
  const user = await UserModel.findById(userId).lean();
  if (!user) {
    throw new HttpError(404, "User not found.");
  }

  return mapUser({
    _id: { toString: () => user._id.toString() },
    displayName: user.displayName,
    email: user.email,
  });
}

export function verifyToken(token: string) {
  const payload = jwt.verify(token, env.JWT_SECRET);
  if (!payload || typeof payload !== "object" || !("sub" in payload) || typeof payload.sub !== "string") {
    throw new HttpError(401, "Invalid authentication token.");
  }

  return payload.sub;
}
