import { Kafka, Producer } from "kafkajs";
import { Order, OrderStatus } from "../models/order.model";

export class OrderProducer {
  private producer: Producer;

  constructor() {
    const kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || "order-service",
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

  async produceOrderEvent(topic: string, order: Order) {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: order.id,
            value: JSON.stringify(order),
          },
        ],
      });
    } catch (error) {
      console.error(`Error producing message to topic ${topic}:`, error);
      throw error;
    }
  }

  async notifyOrderCreated(order: Order) {
    await this.produceOrderEvent("order_created", order);
  }

  async notifyOrderStatusUpdated(order: Order) {
    await this.produceOrderEvent("order_status_updated", order);

    // Send specific status events
    switch (order.status) {
      case OrderStatus.CONFIRMED:
        await this.produceOrderEvent("order_confirmed", order);
        break;
      case OrderStatus.PREPARING:
        await this.produceOrderEvent("order_preparing", order);
        break;
      case OrderStatus.READY_FOR_PICKUP:
        await this.produceOrderEvent("order_ready_for_pickup", order);
        break;
      case OrderStatus.OUT_FOR_DELIVERY:
        await this.produceOrderEvent("order_out_for_delivery", order);
        break;
      case OrderStatus.DELIVERED:
        await this.produceOrderEvent("order_delivered", order);
        break;
      case OrderStatus.CANCELLED:
        await this.produceOrderEvent("order_cancelled", order);
        break;
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
