import grpc from "@grpc/grpc-js";
import { ProductRepository } from "../repository/product.repository.js";

type GetProductGrpcRequest = {
    productId: string;
};

type GetProductsGrpcRequest = {
    productIds: string[];
};

type ProductGrpcDetails = {
    productId: string;
    name: string;
    image: string;
    price: number;
    sellerId: string;
    sellerName: string;
    stock: number;
    rating: number;
    reviewCount: number;
    storeId: string;
    storeName: string;
};

type GetProductsGrpcResponse = {
    products: ProductGrpcDetails[];
};

type ProductGrpcHandlers = {
    GetProduct: grpc.handleUnaryCall<GetProductGrpcRequest, ProductGrpcDetails>;
    GetProducts: grpc.handleUnaryCall<GetProductsGrpcRequest, GetProductsGrpcResponse>;
};

const repository = new ProductRepository();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const grpcError = (code: number, message: string): grpc.ServiceError =>
    Object.assign(new Error(message), {
        code,
        details: message,
        metadata: new grpc.Metadata(),
    });

const isValidProductId = (productId: string) => uuidPattern.test(productId);

const handleRepositoryError = <T>(
    error: unknown,
    callback: grpc.sendUnaryData<T>,
) => {
    console.error("Product gRPC request failed:", error);
    callback(grpcError(grpc.status.INTERNAL, "Unable to retrieve product data."));
};

export const productGrpcService: ProductGrpcHandlers = {
    GetProduct: (call, callback) => {
        const { productId } = call.request;
        if (!isValidProductId(productId)) {
            callback(grpcError(grpc.status.INVALID_ARGUMENT, "productId must be a UUID."));
            return;
        }

        void repository.getProductsForGrpc([productId]).then(([product]) => {
            if (!product) {
                callback(grpcError(grpc.status.NOT_FOUND, "Product not found."));
                return;
            }
            callback(null, product);
        }).catch((error: unknown) => handleRepositoryError(error, callback));
    },
    GetProducts: (call, callback) => {
        const { productIds } = call.request;
        if (!productIds.every(isValidProductId)) {
            callback(grpcError(grpc.status.INVALID_ARGUMENT, "productIds must contain only UUIDs."));
            return;
        }

        void repository.getProductsForGrpc(productIds).then((products) => {
            callback(null, { products });
        }).catch((error: unknown) => handleRepositoryError(error, callback));
    },
};
