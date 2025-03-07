import { Kafka, Consumer, EachMessagePayload } from "kafkajs";
import { NotificationService } from "../services/notification.service";
import { NotificationType } from "../models/notification.model";

export class NotificationConsumer {
  private consumer: Consumer;
  private notificationService: NotificationService;

  constructor(kafka: Kafka, notificationService: NotificationService) {
    this.consumer = kafka.consumer({ groupId: "notification-service-group" });
    this.notificationService = notificationService;
  }

  async connect(): Promise<void> {
    try {
      await this.consumer.connect();
      console.log("Notification Consumer connected to Kafka");

      // Subscribe to relevant topics
      await this.consumer.subscribe({
        topics: [
          "order_status_updated",
          "delivery_status_updated",
          "payment_processed",
          "payment_failed",
          "driver_assigned",
          "delivery_completed",
        ],
        fromBeginning: false,
      });

      await this.startConsumer();
    } catch (error) {
      console.error("Error connecting Notification Consumer to Kafka:", error);
      throw error;
    }
  }

  private async startConsumer(): Promise<void> {
    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        try {
          const { topic, message } = payload;
          const data = JSON.parse(message.value?.toString() || "{}");

          switch (topic) {
            case "order_status_updated":
              await this.handleOrderStatusUpdate(data);
              break;
            case "delivery_status_updated":
              await this.handleDeliveryStatusUpdate(data);
              break;
            case "payment_processed":
              await this.handlePaymentProcessed(data);
              break;
            case "payment_failed":
              await this.handlePaymentFailed(data);
              break;
            case "driver_assigned":
              await this.handleDriverAssigned(data);
              break;
            case "delivery_completed":
              await this.handleDeliveryCompleted(data);
              break;
            default:
              console.warn(`No handler for topic: ${topic}`);
          }
        } catch (error) {
          console.error("Error processing message:", error);
        }
      },
    });
  }

  private async handleOrderStatusUpdate(data: any): Promise<void> {
    await this.notificationService.createNotification({
      userId: data.userId,
      type: NotificationType.ORDER_STATUS,
      title: "Order Status Update",
      message: `Your order #${
        data.orderId
      } is now ${data.status.toLowerCase()}`,
      metadata: {
        orderId: data.orderId,
        status: data.status,
      },
    });
  }

  private async handleDeliveryStatusUpdate(data: any): Promise<void> {
    await this.notificationService.createNotification({
      userId: data.userId,
      type: NotificationType.DELIVERY_UPDATE,
      title: "Delivery Update",
      message: `Your delivery for order #${
        data.orderId
      } is ${data.status.toLowerCase()}`,
      metadata: {
        orderId: data.orderId,
        status: data.status,
        location: data.currentLocation,
      },
    });
  }

  private async handlePaymentProcessed(data: any): Promise<void> {
    await this.notificationService.createNotification({
      userId: data.userId,
      type: NotificationType.PAYMENT_STATUS,
      title: "Payment Successful",
      message: `Your payment of ${data.amount} ${data.currency} for order #${data.orderId} has been processed successfully`,
      metadata: {
        orderId: data.orderId,
        amount: data.amount,
        currency: data.currency,
        transactionId: data.transactionId,
      },
    });
  }

  private async handlePaymentFailed(data: any): Promise<void> {
    await this.notificationService.createNotification({
      userId: data.userId,
      type: NotificationType.PAYMENT_STATUS,
      title: "Payment Failed",
      message: `Your payment for order #${data.orderId} has failed. ${data.errorMessage}`,
      metadata: {
        orderId: data.orderId,
        errorMessage: data.errorMessage,
      },
    });
  }

  private async handleDriverAssigned(data: any): Promise<void> {
    await this.notificationService.createNotification({
      userId: data.userId,
      type: NotificationType.DELIVERY_UPDATE,
      title: "Driver Assigned",
      message: `${data.driverName} has been assigned to deliver your order #${data.orderId}`,
      metadata: {
        orderId: data.orderId,
        driverId: data.driverId,
        driverName: data.driverName,
      },
    });
  }

  private async handleDeliveryCompleted(data: any): Promise<void> {
    await this.notificationService.createNotification({
      userId: data.userId,
      type: NotificationType.DELIVERY_UPDATE,
      title: "Delivery Completed",
      message: `Your order #${data.orderId} has been delivered. Enjoy your meal!`,
      metadata: {
        orderId: data.orderId,
        deliveryTime: data.deliveryTime,
      },
    });
  }

  async disconnect(): Promise<void> {
    try {
      await this.consumer.disconnect();
    } catch (error) {
      console.error("Error disconnecting from Kafka:", error);
    }
  }
}
