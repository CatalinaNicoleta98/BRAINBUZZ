import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFilePath);

const candidateEnvPaths = [
  resolve(process.cwd(), ".env"),
  resolve(currentDir, "../../../.env"),
];

for (const envPath of candidateEnvPaths) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

dotenv.config();

const corsOriginsSchema = z
  .string()
  .default("http://localhost:5173")
  .transform((value) =>
    value
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.string().url()).min(1));

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DBHOST: z.string().min(1, "DBHOST is required."),
  CORS_ORIGINS: corsOriginsSchema,
  JWT_SECRET: z.string().min(12).default("brainbuzz-local-secret"),
});

export const env = envSchema.parse({
  PORT: process.env.PORT,
  DBHOST: process.env.DBHOST,
  CORS_ORIGINS: process.env.CORS_ORIGINS,
  JWT_SECRET: process.env.JWT_SECRET,
});
