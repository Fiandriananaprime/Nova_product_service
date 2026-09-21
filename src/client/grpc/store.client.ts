import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const protoPath = require.resolve(
    "@Fiandriananaprime/nova_grpc/proto/category.proto"
);

const packageDefinition = await protoLoader.load(protoPath);

const grpcObject = grpc.loadPackageDefinition(packageDefinition);
const categoryPackage = grpcObject["category"] as any;

const client = new categoryPackage.CategoryService( "nova-store-service:50051", grpc.credentials.createInsecure());

export const getRelatedCategoryIds = ( categoryId: string): Promise<string[]> =>
    new Promise((resolve, reject) => {
        client.GetRelatedCategoryIds(
            { categoryId },
            (error: Error | null, response: { categoryIds: string[] }) => {
                if (error) return reject(error);

                resolve(response.categoryIds);
            }
        );
    });