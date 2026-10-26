import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { ProductImageError } from "../errorHandler/ProductImageError.js";

const bucketName = process.env["FIREBASE_STORAGE_BUCKET"];

function getFirebaseBucket() {
    if (!bucketName) {
        throw new ProductImageError("FIREBASE_STORAGE_BUCKET is not configured", 500);
    }
    const app = getApps()[0] ?? initializeApp({
        credential: applicationDefault(),
        storageBucket: bucketName,
    });
    return getStorage(app).bucket(bucketName);
}

export async function verifyFirebaseImagePath(path: string): Promise<void> {
    if (
        typeof path !== "string" ||
        path.length === 0 ||
        path.length > 1024 ||
        path.startsWith("/") ||
        path.includes("\\") ||
        path.split("/").some((segment) => !segment || segment === "." || segment === "..") ||
        path.includes("?") ||
        path.includes("#")
    ) {
        throw new ProductImageError("Invalid Firebase Storage object path", 400);
    }

    try {
        const file = getFirebaseBucket().file(path);
        const [exists] = await file.exists();
        if (!exists) {
            throw new ProductImageError("Firebase Storage image does not exist", 400);
        }

        const [metadata] = await file.getMetadata();
        if (!metadata.contentType?.toLowerCase().startsWith("image/")) {
            throw new ProductImageError("Firebase Storage object is not an image", 400);
        }
    } catch (error) {
        if (error instanceof ProductImageError) throw error;
        throw new ProductImageError("Firebase Storage image verification failed", 500);
    }
}
