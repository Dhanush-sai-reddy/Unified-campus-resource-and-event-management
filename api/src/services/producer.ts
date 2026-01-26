import { getRabbitChannel, getKafkaProducer } from '../config/brokers';

export const publishAnnouncement = async (msg: string) => {
    try {
        const channel = await getRabbitChannel();
        if (channel) {
            channel.sendToQueue('announcements', Buffer.from(msg));
            console.log("Published to RabbitMQ:", msg);
        } else {
            console.log("RabbitMQ not connected, skipping announcement:", msg);
        }
    } catch (e) {
        console.error("RabbitMQ Publish Error", e);
    }
};

export const publishEvent = async (event: any) => {
    try {
        const producer = getKafkaProducer();
        if (producer) {
            await producer.send({
                topic: 'events',
                messages: [{ value: JSON.stringify(event) }],
            });
            console.log("Published to Kafka:", event.title);
        } else {
            console.log("Kafka not connected, skipping event publish");
        }
    } catch (e) {
        console.error("Kafka Publish Error", e);
    }
};
