import Fastify from "fastify"
import { 
  registerHealth,registerReady, 
  registerVersion,registerMetrics 
} from "@Fiandriananaprime/service-core";

import { routes } from "./route.js"

import { prisma } from "./database/prisma.js";
import { AppError } from "./errorHandler/AppError.js";
import { userContext } from "./middleware/userContext.js";


export const app = Fastify();

app.addHook("preHandler", userContext);

registerHealth(app);

registerReady(app, {
  database: async () => {
    await prisma.$queryRaw`SELECT 1`;
  }
})

registerVersion(app, {
  service: "product service",
  version: process.env["SERVICE_VERSION"] ?? "unknown",
  commit: process.env["GIT_COMMIT"] ?? "unknown"
});

registerMetrics(app);

routes(app)

app.setErrorHandler((error, request, reply) => {
  request.log.error(error);

   if (
    typeof error === "object" &&
    error !== null &&
    "validation" in error
  ) {
    return reply.status(400).send({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed.",
        details: error.validation,
      },
    });
  }
  
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  return reply.status(500).send({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    },
  });
});