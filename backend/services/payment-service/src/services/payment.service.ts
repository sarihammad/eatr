import { Payment, PaymentStatus } from "../models/payment.model";
import Stripe from "stripe";

export class PaymentService {
  private stripe: Stripe;

  constructor(stripeSecretKey: string) {
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });
  }

  async processPayment(payment: Payment): Promise<Payment> {
    try {
      // Create a payment intent with Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: this.convertToCents(payment.amount),
        currency: payment.currency.toLowerCase(),
        payment_method: payment.paymentMethodId,
        confirm: true,
        return_url: process.env.PAYMENT_RETURN_URL,
        metadata: {
          orderId: payment.orderId,
          userId: payment.userId,
        },
      });

      // Update payment status based on Stripe response
      let status: PaymentStatus;
      let errorMessage: string | undefined;

      switch (paymentIntent.status) {
        case "succeeded":
          status = PaymentStatus.COMPLETED;
          break;
        case "requires_payment_method":
        case "requires_confirmation":
        case "requires_action":
          status = PaymentStatus.PROCESSING;
          break;
        case "canceled":
          status = PaymentStatus.FAILED;
          errorMessage = "Payment was canceled";
          break;
        default:
          status = PaymentStatus.FAILED;
          errorMessage = `Unexpected payment status: ${paymentIntent.status}`;
      }

      // Return updated payment object
      return {
        ...payment,
        status,
        transactionId: paymentIntent.id,
        errorMessage,
        metadata: {
          stripePaymentIntent: paymentIntent.id,
          stripeCustomer: paymentIntent.customer,
          stripePaymentMethod: paymentIntent.payment_method,
        },
      };
    } catch (error) {
      // Handle Stripe errors
      let errorMessage = "Payment processing failed";
      if (error instanceof Stripe.errors.StripeError) {
        errorMessage = error.message;
      }

      return {
        ...payment,
        status: PaymentStatus.FAILED,
        errorMessage,
      };
    }
  }

  async refundPayment(payment: Payment, amount: number): Promise<Payment> {
    try {
      if (!payment.transactionId) {
        throw new Error("No transaction ID found for refund");
      }

      // Create refund with Stripe
      const refund = await this.stripe.refunds.create({
        payment_intent: payment.transactionId,
        amount: this.convertToCents(amount),
        metadata: {
          orderId: payment.orderId,
          userId: payment.userId,
          reason: "customer_requested",
        },
      });

      // Return updated payment object
      return {
        ...payment,
        status: PaymentStatus.REFUNDED,
        refundId: refund.id,
        metadata: {
          ...payment.metadata,
          stripeRefund: refund.id,
        },
      };
    } catch (error) {
      let errorMessage = "Refund processing failed";
      if (error instanceof Stripe.errors.StripeError) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  private convertToCents(amount: number): number {
    return Math.round(amount * 100);
  }
}
