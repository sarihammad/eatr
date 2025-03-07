import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { validateNotification } from "../middlewares/validation.middleware";

export function createNotificationRoutes(
  notificationController: NotificationController
): Router {
  const router = Router();

  // Get user's notifications
  router.get(
    "/users/:userId/notifications",
    authenticateToken,
    notificationController.getUserNotifications
  );

  // Create a new notification
  router.post(
    "/notifications",
    authenticateToken,
    validateNotification,
    notificationController.createNotification
  );

  // Mark a notification as read
  router.patch(
    "/notifications/:id/read",
    authenticateToken,
    notificationController.markNotificationAsRead
  );

  // Create system notification
  router.post(
    "/notifications/system",
    authenticateToken,
    notificationController.createSystemNotification
  );

  // Create order status notification
  router.post(
    "/notifications/order-status",
    authenticateToken,
    notificationController.createOrderStatusNotification
  );

  // Create delivery update notification
  router.post(
    "/notifications/delivery-update",
    authenticateToken,
    notificationController.createDeliveryUpdateNotification
  );

  return router;
}
