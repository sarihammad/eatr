import { Kafka, Consumer, EachMessagePayload } from "kafkajs";
import {
  OrderModel,
  OrderStatus,
  UpdateOrderStatusDTO,
} from "../models/order.model";
import { Pool } from "pg";

export class OrderConsumer {
  private consumer: Consumer;
  private orderModel: OrderModel;

  constructor(pool: Pool) {
    const kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || "order-service-consumer",
      brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
    });

    this.consumer = kafka.consumer({
      groupId: process.env.KAFKA_GROUP_ID || "order-service-group",
    });
    this.orderModel = new OrderModel(pool);
  }

  async connect() {
    try {
      await this.consumer.connect();
      console.log("Successfully connected to Kafka consumer");

      // Subscribe to relevant topics
      await this.consumer.subscribe({
        topics: [
          "restaurant_order_confirmed",
          "restaurant_order_rejected",
          "payment_processed",
          "payment_failed",
          "driver_assigned",
          "driver_pickup_completed",
          "driver_delivery_completed",
        ],
      });

      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          const { topic, message } = payload;
          const value = message.value?.toString();

          if (!value) return;

          const data = JSON.parse(value);
          await this.handleMessage(topic, data);
        },
      });
    } catch (error) {
      console.error("Error connecting to Kafka consumer:", error);
    }
  }

  private async handleMessage(topic: string, data: any) {
    const orderId = data.orderId;

    try {
      switch (topic) {
        case "restaurant_order_confirmed":
          await this.updateOrderStatus(orderId, {
            status: OrderStatus.CONFIRMED,
          });
          break;

        case "restaurant_order_rejected":
          await this.updateOrderStatus(orderId, {
            status: OrderStatus.CANCELLED,
          });
          break;

        case "payment_processed":
          await this.updateOrderStatus(orderId, {
            status: OrderStatus.PREPARING,
          });
          break;

        case "payment_failed":
          await this.updateOrderStatus(orderId, {
            status: OrderStatus.CANCELLED,
          });
          break;

        case "driver_assigned":
          await this.updateOrderStatus(orderId, {
            status: OrderStatus.READY_FOR_PICKUP,
            driverId: data.driverId,
            estimatedDeliveryTime: new Date(data.estimatedDeliveryTime),
          });
          break;

        case "driver_pickup_completed":
          await this.updateOrderStatus(orderId, {
            status: OrderStatus.OUT_FOR_DELIVERY,
          });
          break;

        case "driver_delivery_completed":
          await this.updateOrderStatus(orderId, {
            status: OrderStatus.DELIVERED,
            actualDeliveryTime: new Date(),
          });
          break;

        default:
          console.log(`No handler for topic ${topic}`);
      }
    } catch (error) {
      console.error(`Error processing message from topic ${topic}:`, error);
    }
  }

  private async updateOrderStatus(
    orderId: string,
    updateData: UpdateOrderStatusDTO
  ) {
    await this.orderModel.updateOrderStatus(orderId, updateData);
  }

  async disconnect() {
    try {
      await this.consumer.disconnect();
    } catch (error) {
      console.error("Error disconnecting from Kafka consumer:", error);
    }
  }
}
