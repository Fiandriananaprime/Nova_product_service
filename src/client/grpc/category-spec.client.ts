import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { fileURLToPath } from "node:url";

export type CategorySpecType =
    | "TEXT"
    | "NUMBER"
    | "BOOLEAN"
    | "SELECT"
    | "MULTI_SELECT";

export type CategorySpec = {
    id: string;
    categoryId: string;
    key: string;
    name: string;
    type: CategorySpecType;
    required: boolean;
    filterable: boolean;
    searchable: boolean;
    options: unknown | null;
};

type CategorySpecGrpcItem = {
    id: string;
    categoryId: string;
    key: string;
    name: string;
    type: string;
    required: boolean;
    filterable: boolean;
    searchable: boolean;
    optionsJson: string;
};

type GetCategorySpecsResponse = {
    categoryId: string;
    specs: CategorySpecGrpcItem[];
};

type CategorySpecClient = {
    GetCategorySpecs(
        request: { categoryId: string },
        callback: (error: grpc.ServiceError | null, response: GetCategorySpecsResponse) => void,
    ): void;
};

let clientPromise: Promise<CategorySpecClient> | undefined;

const getClient = async (): Promise<CategorySpecClient> => {
    if (!clientPromise) {
        clientPromise = (async () => {
            const protoPath = fileURLToPath(new URL("./proto/category-spec.proto", import.meta.url));
            const packageDefinition = await protoLoader.load(protoPath, { defaults: true });
            const grpcObject = grpc.loadPackageDefinition(packageDefinition);
            const categorySpecPackage = grpcObject["categoryspec"] as unknown as {
                CategorySpecService: new (
                    address: string,
                    credentials: grpc.ChannelCredentials,
                ) => CategorySpecClient;
            };
            const address = process.env["STORE_GRPC_ADDRESS"] || "nova-store-service:50051";

            return new categorySpecPackage.CategorySpecService(
                address,
                grpc.credentials.createInsecure(),
            );
        })();
    }

    return clientPromise;
};

export const getCategorySpecs = async (categoryId: string): Promise<CategorySpec[]> => {
    const client = await getClient();

    return new Promise((resolve, reject) => {
        client.GetCategorySpecs({ categoryId }, (error, response) => {
            if (error) {
                reject(error);
                return;
            }

            try {
                const specs: CategorySpec[] = (response.specs ?? []).map((spec) => ({
                    id: spec.id,
                    categoryId: spec.categoryId,
                    key: spec.key,
                    name: spec.name,
                    type: spec.type as CategorySpecType,
                    required: spec.required,
                    filterable: spec.filterable,
                    searchable: spec.searchable,
                    options: spec.optionsJson ? JSON.parse(spec.optionsJson) as unknown : null,
                }));

                resolve(specs);
            } catch (cause) {
                reject(new Error("Store service returned invalid category specification options.", { cause }));
            }
        });
    });
};
