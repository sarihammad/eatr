import { Consumer, EachMessagePayload, Kafka } from "kafkajs";
import { KafkaServiceConfig } from "./kafka.config";

export abstract class BaseKafkaConsumer {
  protected consumer: Consumer;
  protected topics: string[];

  constructor(kafka: Kafka, config: KafkaServiceConfig, topics: string[]) {
    this.consumer = kafka.consumer({ groupId: config.groupId });
    this.topics = topics;
  }

  async connect(): Promise<void> {
    try {
      await this.consumer.connect();
      console.log("Consumer connected to Kafka");

      await this.consumer.subscribe({
        topics: this.topics,
        fromBeginning: false,
      });

      await this.startConsumer();
    } catch (error) {
      console.error("Error connecting consumer to Kafka:", error);
      throw error;
    }
  }

  protected async startConsumer(): Promise<void> {
    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        try {
          await this.handleMessage(payload);
        } catch (error) {
          console.error("Error processing message:", error);
        }
      },
    });
  }

  abstract handleMessage(payload: EachMessagePayload): Promise<void>;

  async disconnect(): Promise<void> {
    try {
      await this.consumer.disconnect();
    } catch (error) {
      console.error("Error disconnecting consumer from Kafka:", error);
    }
  }
}
