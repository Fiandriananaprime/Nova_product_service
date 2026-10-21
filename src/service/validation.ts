import type { CategorySpec } from "../client/grpc/category-spec.client.js";
import { ProductValidationError } from "../errorHandler/ProductValidationError.js";
import type { Prisma } from "../generated/prisma/index.js";

export type ProductSpecValue = string | number | boolean | string[];
export type ProductSpecs = Record<string, ProductSpecValue>;

export function validateProductSpecs(
  categorySpecs: CategorySpec[],
  input: unknown
): ProductSpecs {
  if (
    input === null ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    throw new Error("Product specs must be an object");
  }

  const specs = input as Record<string, unknown>;
  const allowedKeys = new Set(categorySpecs.map((spec) => spec.key));

  for (const key of Object.keys(specs)) {
    if (!allowedKeys.has(key)) {
      throw new Error(`Unknown product specification: ${key}`);
    }
  }

  const result: ProductSpecs = {};

  for (const spec of categorySpecs) {
    const value = specs[spec.key];
    const missing =
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0);

    if (missing) {
      if (spec.required) {
        throw new ProductValidationError(`Specification "${spec.key}" is required`);
      }

      continue;
    }

    switch (spec.type) {
      case "TEXT":
        if (typeof value !== "string") {
          throw new ProductValidationError(`"${spec.key}" must be a string`);
        }
        break;

      case "NUMBER":
        if (typeof value !== "number" || !Number.isFinite(value)) {
          throw new ProductValidationError(`"${spec.key}" must be a valid number`);
        }
        break;

      case "BOOLEAN":
        if (typeof value !== "boolean") {
          throw new ProductValidationError(`"${spec.key}" must be a boolean`);
        }
        break;

      case "SELECT": {
        if (typeof value !== "string") {
          throw new ProductValidationError(`"${spec.key}" must be a string`);
        }

        const options = getStringOptions(spec.options);

        if (!options.includes(value)) {
          throw new ProductValidationError(`Invalid option "${value}" for "${spec.key}"`);
        }
        break;
      }

      case "MULTI_SELECT": {
        if (
          !Array.isArray(value) ||
          !value.every((item) => typeof item === "string")
        ) {
          throw new ProductValidationError(`"${spec.key}" must be an array of strings`);
        }

        const options = getStringOptions(spec.options);

        if (!value.every((item) => options.includes(item))) {
          throw new ProductValidationError(`Invalid option for "${spec.key}"`);
        }

        if (new Set(value).size !== value.length) {
          throw new ProductValidationError(`Duplicate options for "${spec.key}"`);
        }
        break;
      }
    }

    result[spec.key] = value as ProductSpecValue;
  }

  return result;
}

export interface ProductVariant {
  name?: string;
  values?: string[];
}

export function parseProductVariants(
  value: Prisma.JsonValue
): ProductVariant[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value.map((item, index) => {
    if (
      item === null ||
      typeof item !== "object" ||
      Array.isArray(item)
    ) {
      throw new ProductValidationError(`Invalid product variant at index ${index}`);
    }

    if (
      (item['name'] !== undefined && typeof item['name'] !== "string") ||
      (item['values'] !== undefined &&
        (!Array.isArray(item['values']) ||
          !item['values'].every((v) => typeof v === "string")))
    ) {
      throw new ProductValidationError(`Invalid product variant at index ${index}`);
    }

    return {
      ...(typeof item['name'] === "string" && { name: item['name'] }),
      ...(Array.isArray(item['values']) && {
        values: item['values'] as string[],
      }),
    };
  });
}

function getStringOptions(options: unknown): string[] {
  if (
    !Array.isArray(options) ||
    !options.every((option) => typeof option === "string")
  ) {
    throw new ProductValidationError("Invalid category specification options configuration");
  }

  return options;
}