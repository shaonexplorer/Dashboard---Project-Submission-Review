import dotenv from "dotenv";

dotenv.config();

type NodeEnv = "development" | "production" | "test";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const nodeEnv = (process.env.NODE_ENV ?? "development") as NodeEnv;

export const env = {
  NODE_ENV: nodeEnv,
  PORT: Number(process.env.PORT) || 5000,
  DATABASE_URL: required("DATABASE_URL"),
  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:3000",
} as const;

export type Env = typeof env;
