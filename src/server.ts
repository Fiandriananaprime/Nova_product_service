import "dotenv/config";

import { app } from "./app.js";
import { ReviewRepository } from "./repository/review.repository.js";
import { ReviewService } from "./service/review.service.js";
import { RabbitMQClient } from "./infrastructure/rabbitmq/RabbitClient.js";
import { OrderDeliveredConsumer } from "./infrastructure/rabbitmq/consumer/OrderDeliverd.js";
import { startGrpcServer } from "./grpc/server.js";

const PORT = Number(process.env["PORT"]) || 3001;

const start = async () => {
    const rabbitUrl = process.env["RABBITMQ_URL"];
    if (!rabbitUrl) {
        throw new Error("RABBITMQ_URL is not defined");
    }
    const exchange = process.env["RABBITMQ_EXCHANGE"] ?? "nova.events";
    const rabbitClient = new RabbitMQClient(rabbitUrl);
    let grpcServer: Awaited<ReturnType<typeof startGrpcServer>> | undefined;

    try {
       await rabbitClient.connect();
       const reviewService = new ReviewService(new ReviewRepository());
       const orderDeliveredConsumer = new OrderDeliveredConsumer(
            rabbitClient.getChannel(),
            exchange,
            reviewService,
       );
       await orderDeliveredConsumer.start();
       app.addHook("onClose", async () => rabbitClient.close());
       grpcServer = await startGrpcServer();
       app.addHook("onClose", async () => {
            if (!grpcServer) return;
            await new Promise<void>((resolve, reject) => {
                grpcServer?.tryShutdown((error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });
       });

       const address =  await app.listen({
            port: PORT,
            host: "0.0.0.0",
        });

        console.log("Service running at: " + address)
    } catch (error) {
        await rabbitClient.close();
        if (grpcServer) {
            await new Promise<void>((resolve, reject) => {
                grpcServer?.tryShutdown((shutdownError) => {
                    if (shutdownError) reject(shutdownError);
                    else resolve();
                });
            });
        }
        console.error(`Service failed to start on port ${PORT}:`, error);
        app.log.error(error);
        process.exit(1);
    }

    
};

process.on("unhandledRejection", (error) => {
    app.log.error(error);
    process.exit(1);
});

process.on("uncaughtException", (error) => {
    app.log.error(error);
    process.exit(1);
});

start();