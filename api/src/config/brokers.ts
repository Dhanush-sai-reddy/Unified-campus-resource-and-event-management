import { createClient, RedisClientType } from 'redis';
// Removed RabbitMQ and Kafka as per simplification request

export let redisClient: RedisClientType | null = null;
export let brokersConnected = false;

export const connectBrokers = async () => {
    try {
        // Redis
        redisClient = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        redisClient.on('error', (err) => console.log('Redis Client Error', err));
        await redisClient.connect();

        console.log("Connected to Redis");
        brokersConnected = true;
    } catch (e) {
        console.warn("Redis connection failed:", e);
        brokersConnected = false;
    }
};

// Removed getRabbitChannel and getKafkaProducer

