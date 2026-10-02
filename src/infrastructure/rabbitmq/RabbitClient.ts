import amqp, {
    type Channel,
    type ChannelModel,
} from "amqplib";

export class RabbitMQClient {
    private connection?: ChannelModel;
    private channel?: Channel;

    constructor(private readonly url: string) {}

    async connect(): Promise<void> {
        this.connection = await amqp.connect(this.url);
        this.channel = await this.connection.createChannel();
    }

    getChannel(): Channel {
        if (!this.channel) {
            throw new Error("RabbitMQ is not connected");
        }

        return this.channel;
    }

    async close(): Promise<void> {
        await this.channel?.close();
        await this.connection?.close();
    }
}