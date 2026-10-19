import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";

dotenv.config();

const app = express();

// CORS — allow the configured frontend origin
app.use(cors({ origin: process.env.CLIENT_URL }));

// Helmet security headers
app.use(helmet());

// JSON body parsing
app.use(express.json());

// Health-check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Server is running",
  });
});

export default app;
