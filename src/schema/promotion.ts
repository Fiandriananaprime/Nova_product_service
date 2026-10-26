export const PromotionInputSchema = {
  body: {
    type: "object",
    required: ["name", "type", "discount", "startDate", "endDate"],
    properties: {
      name: { type: "string" },
      type: { type: "string", enum: ["percentage", "fixed"] },
      discount: { type: "number", minimum: 0 },
      code: { type: "string", nullable: true },
      productIds: {
        type: "array",
        items: { type: "string", format: "uuid" },
      },
      startDate: { type: "string", format: "date" },
      endDate: { type: "string", format: "date" },
      minimumOrderAmount: {
        type: "number",
        minimum: 0,
        nullable: true,
      },
      maximumDiscount: {
        type: "number",
        minimum: 0,
        nullable: true,
      },
      usageLimit: {
        type: "integer",
        minimum: 1,
        nullable: true,
      },
      isAutomatic: { type: "boolean", default: false },
    },
    additionalProperties: false,
  },
} as const;