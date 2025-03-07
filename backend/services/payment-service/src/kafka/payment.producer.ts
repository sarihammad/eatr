import { Kafka, Producer } from "kafkajs";
import { Payment } from "../models/payment.model";

export class PaymentProducer {
  private producer: Producer;

  constructor(kafka: Kafka) {
    this.producer = kafka.producer();
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      console.log("Payment Producer connected to Kafka");
    } catch (error) {
      console.error("Error connecting Payment Producer to Kafka:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      console.log("Payment Producer disconnected from Kafka");
    } catch (error) {
      console.error("Error disconnecting Payment Producer from Kafka:", error);
      throw error;
    }
  }

  async sendPaymentProcessed(payment: Payment): Promise<void> {
    try {
      await this.producer.send({
        topic: "payment_processed",
        messages: [
          {
            key: payment.orderId,
            value: JSON.stringify({
              orderId: payment.orderId,
              userId: payment.userId,
              status: payment.status,
              amount: payment.amount,
              currency: payment.currency,
              transactionId: payment.transactionId,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });

      console.log(`Payment processed event sent for order ${payment.orderId}`);
    } catch (error) {
      console.error("Error sending payment processed event:", error);
      throw error;
    }
  }

  async sendPaymentFailed(payment: Payment): Promise<void> {
    try {
      await this.producer.send({
        topic: "payment_failed",
        messages: [
          {
            key: payment.orderId,
            value: JSON.stringify({
              orderId: payment.orderId,
              userId: payment.userId,
              status: payment.status,
              errorMessage: payment.errorMessage,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });

      console.log(`Payment failed event sent for order ${payment.orderId}`);
    } catch (error) {
      console.error("Error sending payment failed event:", error);
      throw error;
    }
  }

  async sendPaymentRefunded(payment: Payment): Promise<void> {
    try {
      await this.producer.send({
        topic: "payment_refunded",
        messages: [
          {
            key: payment.orderId,
            value: JSON.stringify({
              orderId: payment.orderId,
              userId: payment.userId,
              status: payment.status,
              amount: payment.amount,
              currency: payment.currency,
              refundId: payment.refundId,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });

      console.log(`Payment refunded event sent for order ${payment.orderId}`);
    } catch (error) {
      console.error("Error sending payment refunded event:", error);
      throw error;
    }
  }
}
