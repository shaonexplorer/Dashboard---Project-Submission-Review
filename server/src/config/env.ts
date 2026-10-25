import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

// Accept both real PostgreSQL URLs and placeholder format for development
const databaseUrlSchema = z.string().refine(
  (val) =>
    val.startsWith("postgresql://") || val.startsWith("postgres://"),
  "DATABASE_URL must be a valid PostgreSQL connection string starting with postgresql:// or postgres://",
);

const envSchema = z.object({
  NODE_ENV: z.enum({ development: "development", production: "production", test: "test" }).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: databaseUrlSchema,
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters").default("development-jwt-secret-key-change-in-production"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CLIENT_URL: z.string().default("http://localhost:3000"),
  // BetterAuth
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters").default("development-better-auth-secret-key-change-in-production"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL").default("http://localhost:5000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export const env = parsed.data;

export type Env = typeof env;