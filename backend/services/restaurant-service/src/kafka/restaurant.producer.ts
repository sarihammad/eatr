import { Kafka, Producer } from "kafkajs";

export class KafkaProducer {
  private producer: Producer;

  constructor() {
    const kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || "restaurant-service",
      brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
    });

    this.producer = kafka.producer();
    this.connect();
  }

  private async connect() {
    try {
      await this.producer.connect();
      console.log("Successfully connected to Kafka");
    } catch (error) {
      console.error("Error connecting to Kafka:", error);
    }
  }

  async produceMessage(topic: string, message: any) {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            value: JSON.stringify(message),
          },
        ],
      });
    } catch (error) {
      console.error(`Error producing message to topic ${topic}:`, error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.producer.disconnect();
    } catch (error) {
      console.error("Error disconnecting from Kafka:", error);
    }
  }
}
