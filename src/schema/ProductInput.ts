import type { FastifyInstance } from "fastify";

export const ProductVariantSchema = {
  $id: "ProductVariant",
  type: "object",
  properties: {
    name: { type: "string" },
    values: {
      type: "array",
      items: { type: "string" },
    },
  },
  additionalProperties: false,
} as const;

export const ProductSpecsSchema = {
  $id: "ProductSpecs",
  type: "object",
  description:
    "Product specifications keyed by the exact keys defined in the selected category's CategorySpec. Values must match the corresponding spec type.",
  additionalProperties: {
    oneOf: [
      { type: "string" },
      { type: "number" },
      { type: "boolean" },
      {
        type: "array",
        items: { type: "string" },
      },
    ],
  },
} as const;

export const ProductStatusSchema = {
  $id: "ProductStatus",
  type: "string",
  enum: ["active", "inactive"],
} as const;

export const ProductInputSchema = {
  $id: "ProductInput",
  type: "object",
  required: ["name", "price", "categoryId", "stock"],
  description:
    "New seller products are created as moderation drafts. Submit a draft for review by PATCHing its resource with moderationStatus pending.",
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    brand: { type: "string", nullable: true },
    categoryId: { type: "string", format: "uuid" },
    tags: {
      type: "array",
      items: { type: "string" },
    },
    images: {
      type: "array",
      items: {
        type: "object",
        required: ["path"],
        properties: {
          path: { type: "string", minLength: 1, maxLength: 1024, pattern: "^[^/].*" },
          isDefault: { type: "boolean", default: false },
        },
        additionalProperties: false,
      },
    },
    price: { type: "number", minimum: 0 },
    stock: { type: "integer", minimum: 0 },
    specs: { $ref: "ProductSpecs#" },
    variants: {
      type: "array",
      items: { $ref: "ProductVariant#" },
    },
    status: {
      $ref: "ProductStatus#",
      default: "inactive",
    },
  },
  additionalProperties: false,
} as const;

export async function registerProductSchemas(
  fastify: FastifyInstance,
): Promise<void> {
  fastify.addSchema(ProductVariantSchema);
  fastify.addSchema(ProductSpecsSchema);
  fastify.addSchema(ProductStatusSchema);
  fastify.addSchema(ProductInputSchema);
}