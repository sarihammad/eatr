import { Kafka, Producer } from "kafkajs";
import { Notification } from "../models/notification.model";

export class NotificationProducer {
  private producer: Producer;

  constructor(kafka: Kafka) {
    this.producer = kafka.producer();
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      console.log("Notification Producer connected to Kafka");
    } catch (error) {
      console.error("Error connecting Notification Producer to Kafka:", error);
      throw error;
    }
  }

  async notificationCreated(notification: Notification): Promise<void> {
    try {
      await this.producer.send({
        topic: "notification_created",
        messages: [
          {
            key: notification.id,
            value: JSON.stringify(notification),
          },
        ],
      });
    } catch (error) {
      console.error("Error producing notification_created event:", error);
      throw error;
    }
  }

  async notificationRead(notification: Notification): Promise<void> {
    try {
      await this.producer.send({
        topic: "notification_read",
        messages: [
          {
            key: notification.id,
            value: JSON.stringify(notification),
          },
        ],
      });
    } catch (error) {
      console.error("Error producing notification_read event:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
    } catch (error) {
      console.error("Error disconnecting from Kafka:", error);
    }
  }
}
