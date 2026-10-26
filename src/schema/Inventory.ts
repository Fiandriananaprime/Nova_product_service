export const InventoryUpdateSchema = {
  body: {
    type: "object",
    properties: {
      stock: { type: "integer", minimum: 0 },
      threshold: { type: "integer", minimum: 0 },
    },
    additionalProperties: false,
  },
} as const;