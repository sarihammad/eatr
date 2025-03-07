import { Router } from "express";
import { DeliveryController } from "../controllers/delivery.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

export function createDeliveryRoutes(
  deliveryController: DeliveryController
): Router {
  const router = Router();

  // Delivery routes
  router.post(
    "/deliveries",
    authenticateToken,
    deliveryController.createDelivery
  );

  router.get(
    "/deliveries/:id",
    authenticateToken,
    deliveryController.getDelivery
  );

  router.get(
    "/deliveries/order/:orderId",
    authenticateToken,
    deliveryController.getDeliveryByOrderId
  );

  router.patch(
    "/deliveries/:id/status",
    authenticateToken,
    deliveryController.updateDeliveryStatus
  );

  // Driver routes
  router.get(
    "/drivers/:driverId/deliveries",
    authenticateToken,
    deliveryController.getDriverDeliveries
  );

  router.patch(
    "/drivers/:driverId/location",
    authenticateToken,
    deliveryController.updateDriverLocation
  );

  router.patch(
    "/drivers/:driverId/availability",
    authenticateToken,
    deliveryController.updateDriverAvailability
  );

  return router;
}
