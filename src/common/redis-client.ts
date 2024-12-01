import { Redis } from "ioredis";
import { EcosystemException } from "../ecosystem-exception";

export type RedisConnection = {
  host?: string;
  port?: number | string;
  keyPrefix?: string;
};

export class RedisService {
  static redisInstance: RedisService;
  static redisOptions: RedisConnection;

  public redisClient: Redis;

  private constructor() {
    this.redisClient = new Redis({
      host: RedisService.redisOptions?.host || "localhost",
      port: Number(RedisService.redisOptions?.port) || 6379,
      keyPrefix: RedisService.redisOptions?.keyPrefix,
    });
  }

  static getInstance(redisOptions?: RedisConnection): RedisService {
    if (!RedisService.redisInstance) {
      RedisService.redisOptions = redisOptions;
      RedisService.redisInstance = new RedisService();
    }
    return RedisService.redisInstance;
  }

  async connect(): Promise<void> {
    try {
      await this.redisClient.connect();
    } catch (e) {
      throw EcosystemException.redisLostConnection();
    }
  }
}
