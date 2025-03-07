import { Request, Response } from "express";
import { NotificationService } from "../services/notification.service";
import { NotificationProducer } from "../kafka/notification.producer";
import { CreateNotificationDTO } from "../models/notification.model";

export class NotificationController {
  constructor(
    private notificationService: NotificationService,
    private notificationProducer: NotificationProducer
  ) {}

  createNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const notificationData: CreateNotificationDTO = req.body;
      const notification = await this.notificationService.createNotification(
        notificationData
      );
      await this.notificationProducer.notificationCreated(notification);
      res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ error: "Failed to create notification" });
    }
  };

  getUserNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.userId;
      const notifications = await this.notificationService.getUserNotifications(
        userId
      );
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  };

  markNotificationAsRead = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const notificationId = req.params.id;
      const notification =
        await this.notificationService.markNotificationAsRead(notificationId);

      if (!notification) {
        res.status(404).json({ error: "Notification not found" });
        return;
      }

      await this.notificationProducer.notificationRead(notification);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  };

  createSystemNotification = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { userId, title, message, metadata } = req.body;
      const notification =
        await this.notificationService.createSystemNotification(
          userId,
          title,
          message,
          metadata
        );
      await this.notificationProducer.notificationCreated(notification);
      res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating system notification:", error);
      res.status(500).json({ error: "Failed to create system notification" });
    }
  };

  createOrderStatusNotification = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { userId, orderId, status, message } = req.body;
      const notification =
        await this.notificationService.createOrderStatusNotification(
          userId,
          orderId,
          status,
          message
        );
      await this.notificationProducer.notificationCreated(notification);
      res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating order status notification:", error);
      res
        .status(500)
        .json({ error: "Failed to create order status notification" });
    }
  };

  createDeliveryUpdateNotification = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { userId, orderId, status, message } = req.body;
      const notification =
        await this.notificationService.createDeliveryUpdateNotification(
          userId,
          orderId,
          status,
          message
        );
      await this.notificationProducer.notificationCreated(notification);
      res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating delivery update notification:", error);
      res
        .status(500)
        .json({ error: "Failed to create delivery update notification" });
    }
  };
}
