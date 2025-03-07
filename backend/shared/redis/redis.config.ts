import { createClient, RedisClientType } from "redis";

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export class RedisWrapper {
  private static instance: RedisWrapper;
  private client: RedisClientType;

  private constructor(config: RedisConfig) {
    this.client = createClient({
      url: `redis://${config.host}:${config.port}`,
      password: config.password,
      database: config.db,
    });

    this.client.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    this.client.on("connect", () => {
      console.log("Connected to Redis");
    });
  }

  public static async getInstance(config?: RedisConfig): Promise<RedisWrapper> {
    if (!RedisWrapper.instance && config) {
      RedisWrapper.instance = new RedisWrapper(config);
      await RedisWrapper.instance.connect();
    }
    if (!RedisWrapper.instance) {
      throw new Error("Redis wrapper not initialized");
    }
    return RedisWrapper.instance;
  }

  public getClient(): RedisClientType {
    return this.client;
  }

  private async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      console.error("Error connecting to Redis:", error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.quit();
    } catch (error) {
      console.error("Error disconnecting from Redis:", error);
    }
  }

  public static createConfig(): RedisConfig {
    return {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || "0"),
    };
  }
}
