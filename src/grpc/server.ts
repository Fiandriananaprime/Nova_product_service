import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { createRequire } from "node:module";
import { productGrpcService } from "./product.grpc.js";

const require = createRequire(import.meta.url);

export const startGrpcServer = async () => {
    const protoPath = require.resolve(
        "@Fiandriananaprime/nova_grpc/proto/product.proto",
    );
    const packageDefinition = await protoLoader.load(protoPath);
    const grpcObject = grpc.loadPackageDefinition(packageDefinition);
    const productPackage = grpcObject["product"] as unknown as {
        ProductService: {
            service: grpc.ServiceDefinition<ProductGrpcHandlers>;
        };
    };

    const server = new grpc.Server();
    server.addService(productPackage.ProductService.service, productGrpcService);

    const port = Number(process.env["PRODUCT_GRPC_PORT"]) || 50051;
    await new Promise<void>((resolve, reject) => {
        server.bindAsync(
            `0.0.0.0:${port}`,
            grpc.ServerCredentials.createInsecure(),
            (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            },
        );
    });

    return server;
};

type ProductGrpcHandlers = typeof productGrpcService;
