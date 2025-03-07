import { Kafka, Producer } from "kafkajs";
import { Delivery, DeliveryStatus, Driver } from "../models/delivery.model";

export class DeliveryProducer {
  private producer: Producer;

  constructor(kafka: Kafka) {
    this.producer = kafka.producer();
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      console.log("Delivery Producer connected to Kafka");
    } catch (error) {
      console.error("Error connecting Delivery Producer to Kafka:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      console.log("Delivery Producer disconnected from Kafka");
    } catch (error) {
      console.error("Error disconnecting Delivery Producer from Kafka:", error);
      throw error;
    }
  }

  async sendDeliveryAssigned(
    delivery: Delivery,
    driver: Driver
  ): Promise<void> {
    try {
      await this.producer.send({
        topic: "delivery_assigned",
        messages: [
          {
            key: delivery.orderId,
            value: JSON.stringify({
              deliveryId: delivery.id,
              orderId: delivery.orderId,
              driverId: driver.id,
              driverName: driver.userId,
              estimatedDeliveryTime: delivery.estimatedDeliveryTime,
              status: DeliveryStatus.ASSIGNED,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });

      console.log(`Delivery assigned event sent for order ${delivery.orderId}`);
    } catch (error) {
      console.error("Error sending delivery assigned event:", error);
      throw error;
    }
  }

  async sendDeliveryPickedUp(delivery: Delivery): Promise<void> {
    try {
      await this.producer.send({
        topic: "delivery_picked_up",
        messages: [
          {
            key: delivery.orderId,
            value: JSON.stringify({
              deliveryId: delivery.id,
              orderId: delivery.orderId,
              driverId: delivery.driverId,
              status: DeliveryStatus.PICKED_UP,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });

      console.log(
        `Delivery picked up event sent for order ${delivery.orderId}`
      );
    } catch (error) {
      console.error("Error sending delivery picked up event:", error);
      throw error;
    }
  }

  async sendDeliveryInTransit(
    delivery: Delivery,
    currentLocation: { latitude: number; longitude: number }
  ): Promise<void> {
    try {
      await this.producer.send({
        topic: "delivery_in_transit",
        messages: [
          {
            key: delivery.orderId,
            value: JSON.stringify({
              deliveryId: delivery.id,
              orderId: delivery.orderId,
              driverId: delivery.driverId,
              status: DeliveryStatus.IN_TRANSIT,
              currentLocation,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });

      console.log(
        `Delivery in transit event sent for order ${delivery.orderId}`
      );
    } catch (error) {
      console.error("Error sending delivery in transit event:", error);
      throw error;
    }
  }

  async sendDeliveryCompleted(delivery: Delivery): Promise<void> {
    try {
      await this.producer.send({
        topic: "delivery_completed",
        messages: [
          {
            key: delivery.orderId,
            value: JSON.stringify({
              deliveryId: delivery.id,
              orderId: delivery.orderId,
              driverId: delivery.driverId,
              status: DeliveryStatus.DELIVERED,
              actualDeliveryTime: delivery.actualDeliveryTime,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });

      console.log(
        `Delivery completed event sent for order ${delivery.orderId}`
      );
    } catch (error) {
      console.error("Error sending delivery completed event:", error);
      throw error;
    }
  }

  async sendDeliveryFailed(delivery: Delivery, reason: string): Promise<void> {
    try {
      await this.producer.send({
        topic: "delivery_failed",
        messages: [
          {
            key: delivery.orderId,
            value: JSON.stringify({
              deliveryId: delivery.id,
              orderId: delivery.orderId,
              driverId: delivery.driverId,
              status: DeliveryStatus.FAILED,
              reason,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });

      console.log(`Delivery failed event sent for order ${delivery.orderId}`);
    } catch (error) {
      console.error("Error sending delivery failed event:", error);
      throw error;
    }
  }

  async sendDeliveryCancelled(
    delivery: Delivery,
    reason: string
  ): Promise<void> {
    try {
      await this.producer.send({
        topic: "delivery_cancelled",
        messages: [
          {
            key: delivery.orderId,
            value: JSON.stringify({
              deliveryId: delivery.id,
              orderId: delivery.orderId,
              driverId: delivery.driverId,
              status: DeliveryStatus.CANCELLED,
              reason,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });

      console.log(
        `Delivery cancelled event sent for order ${delivery.orderId}`
      );
    } catch (error) {
      console.error("Error sending delivery cancelled event:", error);
      throw error;
    }
  }
}
