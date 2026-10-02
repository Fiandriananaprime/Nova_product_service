import type { Channel } from "amqplib";
import type { OrderDeliveredEvent } from "../../../types/event.js";
import type { ReviewService } from "../../../service/review.service.js";

export class OrderDeliveredConsumer {
    constructor(
        private readonly channel: Channel,
        private readonly exchange: string,
        private readonly reviewService: ReviewService
    ) {}

    async start(): Promise<void> {
        const queue = "order.delivered";
        const deadLetterExchange = `${this.exchange}.dlx`;
        const deadLetterQueue = `${queue}.dlq`;

        await this.channel.assertExchange(this.exchange, "topic", {
            durable: true,
        });
        await this.channel.assertExchange(deadLetterExchange, "direct", {
            durable: true,
        });
        await this.channel.assertQueue(deadLetterQueue, {
            durable: true,
        });
        await this.channel.bindQueue(
            deadLetterQueue,
            deadLetterExchange,
            deadLetterQueue,
        );
        await this.channel.assertQueue(queue, {
            durable: true,
            arguments: {
                "x-dead-letter-exchange": deadLetterExchange,
                "x-dead-letter-routing-key": deadLetterQueue,
            },
        });

        await this.channel.bindQueue(
            queue,
            this.exchange,
            "order.delivered",
        );

        await this.channel.prefetch(1);
        await this.channel.consume(queue, async (message) => {
            if (!message) return;

            try {
                const payload: unknown = JSON.parse(
                    message.content.toString(),
                );
                const event = parseOrderDeliveredEvent(payload);

                await this.handle(event);

                this.channel.ack(message);
            } catch (error) {
                console.error(
                    "Failed to process order.delivered:",
                    error,
                );

                this.channel.nack(message, false, false);
            }
        });
    }

    private async handle(event: OrderDeliveredEvent) {
        for (const item of event.items) {
            await this.reviewService.createReviewEligibility({
                userId: event.userId,
                orderId: event.orderId,
                orderItemId: item.orderItemId,
                productId: item.productId
            });
        }
    }
}

const parseOrderDeliveredEvent = (value: unknown): OrderDeliveredEvent => {
    if (
        typeof value !== "object" ||
        value === null ||
        !("orderId" in value) ||
        typeof value.orderId !== "string" ||
        !value.orderId ||
        !("userId" in value) ||
        typeof value.userId !== "string" ||
        !value.userId ||
        !("deliveredAt" in value) ||
        typeof value.deliveredAt !== "string" ||
        Number.isNaN(Date.parse(value.deliveredAt)) ||
        !("items" in value) ||
        !Array.isArray(value.items) ||
        value.items.length === 0 ||
        !value.items.every(
            (item: unknown) =>
                typeof item === "object" &&
                item !== null &&
                "orderItemId" in item &&
                typeof item.orderItemId === "string" &&
                item.orderItemId.length > 0 &&
                "productId" in item &&
                typeof item.productId === "string" &&
                item.productId.length > 0,
        )
    ) {
        throw new Error("Invalid order.delivered event payload");
    }

    return value as OrderDeliveredEvent;
};