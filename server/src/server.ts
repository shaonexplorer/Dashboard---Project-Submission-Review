import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(`Server is running in ${env.NODE_ENV} mode on port ${PORT}`);
});

const shutdown = async () => {
  console.log("Shutting down server...");
  server.close(async () => {
    await prisma.$disconnect();
    console.log("Prisma client disconnected");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
