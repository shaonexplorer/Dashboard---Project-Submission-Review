import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env";
import routes from "./routes";
import { errorHandler } from "./middleware/error.middleware";
import { notFound } from "./middleware/not-found.middleware";
import { globalRateLimiter } from "./middleware/rateLimiter.middleware";

dotenv.config();

const app = express();

// CORS — allow the configured frontend origin; credentials for cross-origin cookies
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));

// Helmet security headers
app.use(helmet());

// JSON body parsing
app.use(express.json());

// Cookie parsing
app.use(cookieParser());

// Global rate limiter — 100 requests per 15 minutes per session.
// It runs after cookie parsing so an authenticated request can be keyed on
// its session rather than on a shared IP address.
app.use(globalRateLimiter);

// Application routes
app.use("/api", routes);

// 404 middleware — must come after all application routes
app.use(notFound);

// Global error middleware — must come last
app.use(errorHandler);

export default app;
