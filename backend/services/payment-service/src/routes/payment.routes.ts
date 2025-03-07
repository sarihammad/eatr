import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

export function createPaymentRoutes(
  paymentController: PaymentController
): Router {
  const router = Router();

  // Create a new payment
  router.post("/payments", authenticateToken, paymentController.createPayment);

  // Get payment by order ID
  router.get(
    "/payments/order/:orderId",
    authenticateToken,
    paymentController.getPaymentByOrderId
  );

  // Get payment status
  router.get(
    "/payments/:paymentId/status",
    authenticateToken,
    paymentController.getPaymentStatus
  );

  // Process refund
  router.post(
    "/payments/:paymentId/refund",
    authenticateToken,
    paymentController.refundPayment
  );

  return router;
}
