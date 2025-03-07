import { Kafka, Producer, Message } from "kafkajs";

export abstract class BaseKafkaProducer {
  protected producer: Producer;

  constructor(kafka: Kafka) {
    this.producer = kafka.producer();
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      console.log("Producer connected to Kafka");
    } catch (error) {
      console.error("Error connecting producer to Kafka:", error);
      throw error;
    }
  }

  protected async sendMessage(
    topic: string,
    messages: Message[],
    retries = 3
  ): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages,
      });
    } catch (error) {
      if (retries > 0) {
        console.warn(
          `Failed to send message to topic ${topic}. Retrying... (${retries} attempts left)`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.sendMessage(topic, messages, retries - 1);
      }
      console.error(`Error sending message to topic ${topic}:`, error);
      throw error;
    }
  }

  protected createMessage(key: string, value: any): Message {
    return {
      key,
      value: JSON.stringify(value),
    };
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
    } catch (error) {
      console.error("Error disconnecting producer from Kafka:", error);
    }
  }
}
