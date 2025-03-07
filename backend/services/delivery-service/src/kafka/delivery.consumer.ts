import { Kafka, Consumer, EachMessagePayload } from "kafkajs";
import { DeliveryModel, DeliveryStatus } from "../models/delivery.model";
import { DeliveryService } from "../services/delivery.service";
import { DeliveryProducer } from "./delivery.producer";

export class DeliveryConsumer {
  private consumer: Consumer;
  private deliveryModel: DeliveryModel;
  private deliveryService: DeliveryService;
  private deliveryProducer: DeliveryProducer;

  constructor(
    kafka: Kafka,
    deliveryModel: DeliveryModel,
    deliveryService: DeliveryService,
    deliveryProducer: DeliveryProducer
  ) {
    this.consumer = kafka.consumer({ groupId: "delivery-service-group" });
    this.deliveryModel = deliveryModel;
    this.deliveryService = deliveryService;
    this.deliveryProducer = deliveryProducer;
  }

  async connect(): Promise<void> {
    try {
      await this.consumer.connect();
      console.log("Delivery Consumer connected to Kafka");

      // Subscribe to topics
      await this.consumer.subscribe({
        topics: [
          "order_confirmed",
          "driver_location_updated",
          "delivery_request_cancelled",
        ],
        fromBeginning: true,
      });

      // Start consuming messages
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });
    } catch (error) {
      console.error("Error connecting Delivery Consumer to Kafka:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.consumer.disconnect();
      console.log("Delivery Consumer disconnected from Kafka");
    } catch (error) {
      console.error("Error disconnecting Delivery Consumer from Kafka:", error);
      throw error;
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, message } = payload;
    if (!message.value) return;

    const data = JSON.parse(message.value.toString());

    try {
      switch (topic) {
        case "order_confirmed":
          await this.handleOrderConfirmed(data);
          break;
        case "driver_location_updated":
          await this.handleDriverLocationUpdated(data);
          break;
        case "delivery_request_cancelled":
          await this.handleDeliveryRequestCancelled(data);
          break;
        default:
          console.warn(`Unhandled topic: ${topic}`);
      }
    } catch (error) {
      console.error(`Error processing message from topic ${topic}:`, error);
      // Handle error appropriately - might want to send to DLQ or retry queue
    }
  }

  private async handleOrderConfirmed(data: any): Promise<void> {
    try {
      // Create delivery request
      const delivery = await this.deliveryModel.createDelivery({
        orderId: data.orderId,
        restaurantLocation: data.restaurantLocation,
        deliveryLocation: data.deliveryLocation,
        notes: data.deliveryInstructions,
      });

      // Find and assign nearest available driver
      const assignedDelivery = await this.deliveryService.assignDriver(
        delivery
      );

      if (assignedDelivery && assignedDelivery.driverId) {
        const driver = await this.deliveryService.getDriver(
          assignedDelivery.driverId
        );
        if (driver) {
          await this.deliveryProducer.sendDeliveryAssigned(
            assignedDelivery,
            driver
          );
        }
      }
    } catch (error) {
      console.error("Error handling order confirmed event:", error);
      // Handle error appropriately
    }
  }

  private async handleDriverLocationUpdated(data: any): Promise<void> {
    try {
      const { driverId, location } = data;
      const updatedDriver = await this.deliveryModel.updateDriverLocation(
        driverId,
        location
      );

      // If driver is currently on a delivery, send in-transit update
      if (updatedDriver && updatedDriver.currentDeliveryId) {
        const delivery = await this.deliveryModel.findById(
          updatedDriver.currentDeliveryId
        );
        if (delivery && delivery.status === DeliveryStatus.IN_TRANSIT) {
          await this.deliveryProducer.sendDeliveryInTransit(delivery, location);
        }
      }
    } catch (error) {
      console.error("Error handling driver location update:", error);
      // Handle error appropriately
    }
  }

  private async handleDeliveryRequestCancelled(data: any): Promise<void> {
    try {
      const { deliveryId, reason } = data;
      const delivery = await this.deliveryModel.findById(deliveryId);

      if (delivery) {
        const updatedDelivery = await this.deliveryModel.updateDeliveryStatus(
          deliveryId,
          {
            status: DeliveryStatus.CANCELLED,
          }
        );

        if (updatedDelivery) {
          await this.deliveryProducer.sendDeliveryCancelled(
            updatedDelivery,
            reason
          );

          // If a driver was assigned, update their availability
          if (updatedDelivery.driverId) {
            await this.deliveryModel.updateDriverAvailability(
              updatedDelivery.driverId,
              true
            );
          }
        }
      }
    } catch (error) {
      console.error("Error handling delivery request cancelled:", error);
      // Handle error appropriately
    }
  }
}
