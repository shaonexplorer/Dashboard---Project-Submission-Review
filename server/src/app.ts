import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env";
import routes from "./routes";
import { errorHandler } from "./middleware/error.middleware";
import { notFound } from "./middleware/not-found.middleware";

dotenv.config();

const app = express();

// CORS — allow the configured frontend origin
app.use(cors({ origin: env.CLIENT_URL }));

// Helmet security headers
app.use(helmet());

// JSON body parsing
app.use(express.json());

// Application routes
app.use("/api", routes);

// 404 middleware — must come after all application routes
app.use(notFound);

// Global error middleware — must come last
app.use(errorHandler);

export default app;
