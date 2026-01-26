import { createClient, RedisClientType } from 'redis';
import amqp from 'amqplib';
import { Kafka, Producer } from 'kafkajs';

export let redisClient: RedisClientType | null = null;
export let brokersConnected = false;

let rabbitChannel: amqp.Channel | null = null;
let kafkaProducer: Producer | null = null;

export const connectBrokers = async () => {
    try {
        // Redis
        redisClient = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        redisClient.on('error', (err) => console.log('Redis Client Error', err));
        await redisClient.connect();

        // MQTT/RabbitMQ (Try connect, log error but don't fail)
        try {
            const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672');
            rabbitChannel = await conn.createChannel();
            await rabbitChannel.assertQueue('announcements', { durable: true });
        } catch (e) { console.log('RabbitMQ connection failed (optional):', e); }

        // Kafka (Try connect, log error but don't fail)
        try {
            const kafka = new Kafka({
                clientId: 'campus-api',
                brokers: [(process.env.KAFKA_BROKER || 'localhost:9092')]
            });
            kafkaProducer = kafka.producer();
            await kafkaProducer.connect();
        } catch (e) { console.log('Kafka connection failed (optional):', e); }

        console.log("Connected to Brokers (Redis mandatory, others optional)");
        brokersConnected = true;
    } catch (e) {
        console.warn("Critical Broker (Redis) connection failed:", e);
        brokersConnected = false;
    }
};

export const getRabbitChannel = async () => rabbitChannel;
export const getKafkaProducer = () => kafkaProducer;
