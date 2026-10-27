import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env";
import routes from "./routes";
import { errorHandler } from "./middleware/error.middleware";
import { notFound } from "./middleware/not-found.middleware";
import { globalRateLimiter } from "./middleware/rateLimiter.middleware";

const app = express();

/**
 * Parse CLIENT_URL as comma-separated list of allowed origins.
 * Example: "http://localhost:3000,https://preview.example.com"
 */
const allowedOrigins = env.CLIENT_URL.split(",").map((origin) => origin.trim());

// CORS — allow configured frontend origins; credentials for cross-origin cookies
// Expose set-auth-token header so the browser can read it after sign-in
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["set-auth-token"],
  }),
);

// Helmet security headers
app.use(helmet());

// JSON body parsing
app.use(express.json());

// Cookie parsing
app.use(cookieParser());

// Input trimming middleware - normalize string fields before validation
app.use((req, _res, next) => {
  const trimStrings = (obj: unknown): unknown => {
    if (typeof obj === "string") {
      return obj.trim();
    }
    if (Array.isArray(obj)) {
      return obj.map(trimStrings);
    }
    if (obj && typeof obj === "object") {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        // Don't trim password fields
        if (key.toLowerCase().includes("password")) {
          result[key] = value;
        } else {
          result[key] = trimStrings(value);
        }
      }
      return result;
    }
    return obj;
  };

  if (req.body) {
    req.body = trimStrings(req.body) as Record<string, unknown>;
  }
  if (req.query) {
    const trimmedQuery = trimStrings(req.query) as Record<
      string,
      string | string[] | undefined
    >;
    req.query = trimmedQuery;
  }
  next();
});

// Global rate limiter — 100 requests per 02 minutes per session.
app.use(globalRateLimiter);

// Application routes
app.use("/api", routes);

// 404 middleware — must come after all application routes
app.use(notFound);

// Global error middleware — must come last
app.use(errorHandler);

export default app;
