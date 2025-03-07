import { Kafka, KafkaConfig } from "kafkajs";

export interface KafkaServiceConfig {
  clientId: string;
  groupId: string;
  brokers: string[];
}

export class KafkaWrapper {
  private static instance: KafkaWrapper;
  private kafka: Kafka;

  private constructor(config: KafkaConfig) {
    this.kafka = new Kafka(config);
  }

  public static getInstance(config?: KafkaConfig): KafkaWrapper {
    if (!KafkaWrapper.instance && config) {
      KafkaWrapper.instance = new KafkaWrapper(config);
    }
    if (!KafkaWrapper.instance) {
      throw new Error("Kafka wrapper not initialized");
    }
    return KafkaWrapper.instance;
  }

  public getKafka(): Kafka {
    return this.kafka;
  }

  public static createConfig(serviceName: string): KafkaServiceConfig {
    return {
      clientId: `${serviceName}-client`,
      groupId: `${serviceName}-group`,
      brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
    };
  }
}
