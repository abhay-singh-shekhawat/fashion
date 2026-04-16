import dotenv from "dotenv"
dotenv.config()

import { createClient } from 'redis';
import IORedis from 'ioredis';

const client = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

client.on('error', (err) => {
    console.log('Redis Client Error', err)
});

client.on('connect', () => {
    console.log('Redis connected successfully');
});

client.on('ready', () => {
    console.log('Redis is ready to accept commands');
});

client.on('reconnecting', () => {
    console.log('Redis reconnecting...');
});

(async () => {
  try {
    await client.connect();
  } catch (err) {
    console.error('Failed to connect to Redis:', err.message);
  }
})();

const bullMqConnection = new IORedis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    // tls: {},
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 15000,
    keepAlive: 10000,
});

bullMqConnection.on('error', (err) => {
    console.error('BullMQ Redis Error:', err.message);
});

export { client as default, bullMqConnection };