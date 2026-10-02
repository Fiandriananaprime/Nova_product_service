export const createProductReviewSchema = {
    params: {
        type: "object",
        required: ["id"],
        properties: {
            id: {
                type: "string",
                format: "uuid",
            },
        },
    },
    body: {
        type: "object",
        required: ["rating", "comment"],
        additionalProperties: false,
        properties: {
            rating: {
                type: "integer",
                minimum: 1,
                maximum: 5,
            },
            comment: {
                type: "string",
                minLength: 1,
            },
        },
    },
} as const;