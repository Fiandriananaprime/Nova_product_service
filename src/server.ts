import "dotenv/config";

import { app } from "./app.js";

const PORT = Number(process.env["PORT"]) || 3001;

const start = async () => {
    try {
       const address =  await app.listen({
            port: PORT,
            host: "0.0.0.0",
        });

        console.log("Service running at: " + address)
    } catch (error) {
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