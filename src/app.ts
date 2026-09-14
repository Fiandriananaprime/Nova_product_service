import Fastify from "fastify"
import { 
  registerHealth,registerReady, 
  registerVersion,registerMetrics 
} from "@Fiandriananaprime/service-core";

import { routes } from "./route.js"

import { prisma } from "./database/prisma.js";


export const app = Fastify();

registerHealth(app);

registerReady(app, {
  database: async () => {
    await prisma.$queryRaw`SELECT 1`;
  }
})

registerVersion(app, {
  service: "user service",
  version: process.env["SERVICE_VERSION"] ?? "unknown",
  commit: process.env["GIT_COMMIT"] ?? "unknown"
});

registerMetrics(app);

routes(app)

