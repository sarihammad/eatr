import { Kafka, Consumer, EachMessagePayload } from "kafkajs";
import { PaymentModel, PaymentStatus } from "../models/payment.model";
import { PaymentService } from "../services/payment.service";
import { PaymentProducer } from "./payment.producer";

export class PaymentConsumer {
  private consumer: Consumer;
  private paymentModel: PaymentModel;
  private paymentService: PaymentService;
  private paymentProducer: PaymentProducer;

  constructor(
    kafka: Kafka,
    paymentModel: PaymentModel,
    paymentService: PaymentService,
    paymentProducer: PaymentProducer
  ) {
    this.consumer = kafka.consumer({ groupId: "payment-service-group" });
    this.paymentModel = paymentModel;
    this.paymentService = paymentService;
    this.paymentProducer = paymentProducer;
  }

  async connect(): Promise<void> {
    try {
      await this.consumer.connect();
      console.log("Payment Consumer connected to Kafka");

      // Subscribe to topics
      await this.consumer.subscribe({
        topics: ["order_created"],
        fromBeginning: true,
      });

      // Start consuming messages
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });
    } catch (error) {
      console.error("Error connecting Payment Consumer to Kafka:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.consumer.disconnect();
      console.log("Payment Consumer disconnected from Kafka");
    } catch (error) {
      console.error("Error disconnecting Payment Consumer from Kafka:", error);
      throw error;
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, message } = payload;
    if (!message.value) return;

    const data = JSON.parse(message.value.toString());

    try {
      switch (topic) {
        case "order_created":
          await this.handleOrderCreated(data);
          break;
        default:
          console.warn(`Unhandled topic: ${topic}`);
      }
    } catch (error) {
      console.error(`Error processing message from topic ${topic}:`, error);
      // Handle error appropriately - might want to send to DLQ or retry queue
    }
  }

  private async handleOrderCreated(data: any): Promise<void> {
    try {
      const payment = await this.paymentModel.createPayment({
        orderId: data.orderId,
        userId: data.userId,
        amount: data.totalAmount,
        currency: data.currency,
        method: data.paymentMethod,
        paymentMethodId: data.paymentMethodId,
      });

      // Process the payment
      const processedPayment = await this.paymentService.processPayment(
        payment
      );

      // Send appropriate event based on payment status
      if (processedPayment.status === PaymentStatus.COMPLETED) {
        await this.paymentProducer.sendPaymentProcessed(processedPayment);
      } else if (processedPayment.status === PaymentStatus.FAILED) {
        await this.paymentProducer.sendPaymentFailed(processedPayment);
      }
    } catch (error) {
      console.error("Error handling order created event:", error);
      // Handle error appropriately - might want to send to DLQ or retry queue
    }
  }
}
