import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: "../../.env" });
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
});

export const env = envSchema.parse({
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  CLIENT_URL: process.env.CLIENT_URL,
});
