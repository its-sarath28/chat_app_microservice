import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis, { Redis as RedisClient } from 'ioredis';

@Injectable()
export class RedisProvider implements OnModuleInit, OnModuleDestroy {
  private client: RedisClient;

  async onModuleInit() {
    this.client = new Redis({
      host: process.env.REDIS_HOST!,
      port: parseInt(process.env.REDIS_PORT!, 10),
      password: process.env.REDIS_PASSWORD || undefined,
    });

    this.client.on('connect', () => console.log('Redis connected ✅'));
    this.client.on('error', (err) => console.error('Redis Error ❌', err));
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  getClient(): RedisClient {
    return this.client;
  }

  // ---------- Utility wrappers ----------

  /** Set a simple key-value pair */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds); // expires after ttlSeconds
    } else {
      await this.client.set(key, value);
    }
  }

  /** Get a simple value by key */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async setJson(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const json = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.set(key, json, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, json);
    }
  }

  /** Get JSON value */
  async getJson<T = any>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? (JSON.parse(data) as T) : null;
  }

  /** Add item to the start of a list */
  async lpush(key: string, value: any): Promise<void> {
    await this.client.lpush(key, JSON.stringify(value));
  }

  /** Get list items (range) */
  async lrange<T = any>(key: string, start = 0, stop = -1): Promise<T[]> {
    const res = await this.client.lrange(key, start, stop);
    return res.map((item) => JSON.parse(item) as T);
  }

  /** Trim list to keep only given range */
  async ltrim(key: string, start: number, stop: number): Promise<void> {
    await this.client.ltrim(key, start, stop);
  }

  /** Add a member to a set */
  async sadd(key: string, member: string): Promise<number> {
    return this.client.sadd(key, member);
  }

  /** Get all members of a set */
  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  /** Remove a member from a set */
  async srem(key: string, member: string): Promise<number> {
    return this.client.srem(key, member);
  }
}
