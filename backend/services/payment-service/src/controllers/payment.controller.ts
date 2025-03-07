import { Request, Response } from "express";
import {
  PaymentModel,
  PaymentStatus,
  CreatePaymentDTO,
  RefundPaymentDTO,
} from "../models/payment.model";
import { PaymentService } from "../services/payment.service";
import { PaymentProducer } from "../kafka/payment.producer";

export class PaymentController {
  constructor(
    private paymentModel: PaymentModel,
    private paymentService: PaymentService,
    private paymentProducer: PaymentProducer
  ) {}

  createPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const paymentData: CreatePaymentDTO = req.body;

      // Create initial payment record
      const payment = await this.paymentModel.createPayment(paymentData);

      // Process the payment
      const processedPayment = await this.paymentService.processPayment(
        payment
      );

      // Send Kafka event based on payment status
      if (processedPayment.status === PaymentStatus.COMPLETED) {
        await this.paymentProducer.sendPaymentProcessed(processedPayment);
      } else if (processedPayment.status === PaymentStatus.FAILED) {
        await this.paymentProducer.sendPaymentFailed(processedPayment);
      }

      res.status(200).json(processedPayment);
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({
        error: "Payment processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  getPaymentByOrderId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const payment = await this.paymentModel.findByOrderId(orderId);

      if (!payment) {
        res.status(404).json({ error: "Payment not found" });
        return;
      }

      res.status(200).json(payment);
    } catch (error) {
      console.error("Error fetching payment:", error);
      res.status(500).json({
        error: "Failed to fetch payment",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  refundPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { paymentId } = req.params;
      const refundData: RefundPaymentDTO = req.body;

      // Get the payment
      const payment = await this.paymentModel.findById(paymentId);
      if (!payment) {
        res.status(404).json({ error: "Payment not found" });
        return;
      }

      // Check if payment can be refunded
      if (payment.status !== PaymentStatus.COMPLETED) {
        res.status(400).json({
          error: "Payment cannot be refunded",
          details: `Current status: ${payment.status}`,
        });
        return;
      }

      // Process refund
      const refundedPayment = await this.paymentService.refundPayment(
        payment,
        refundData.amount
      );

      // Send Kafka event for refund
      await this.paymentProducer.sendPaymentRefunded(refundedPayment);

      res.status(200).json(refundedPayment);
    } catch (error) {
      console.error("Error processing refund:", error);
      res.status(500).json({
        error: "Refund processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { paymentId } = req.params;
      const payment = await this.paymentModel.findById(paymentId);

      if (!payment) {
        res.status(404).json({ error: "Payment not found" });
        return;
      }

      res.status(200).json({
        status: payment.status,
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        transactionId: payment.transactionId,
        errorMessage: payment.errorMessage,
        updatedAt: payment.updatedAt,
      });
    } catch (error) {
      console.error("Error fetching payment status:", error);
      res.status(500).json({
        error: "Failed to fetch payment status",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
