import {
  NotificationModel,
  CreateNotificationDTO,
  Notification,
  NotificationType,
} from "../models/notification.model";
import { RedisClientType, createClient } from "redis";

export class NotificationService {
  constructor(
    private notificationModel: NotificationModel,
    private redisClient: ReturnType<typeof createClient>
  ) {}

  async createNotification(data: CreateNotificationDTO): Promise<Notification> {
    const notification = await this.notificationModel.create(data);

    // Cache the notification in Redis for quick access
    await this.cacheNotification(notification);

    return notification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    // Try to get notifications from cache first
    const cachedNotifications = await this.getCachedNotifications(userId);
    if (cachedNotifications) {
      return cachedNotifications;
    }

    // If not in cache, get from database and cache them
    const notifications = await this.notificationModel.findByUserId(userId);
    await this.cacheUserNotifications(userId, notifications);

    return notifications;
  }

  async markNotificationAsRead(id: string): Promise<Notification | null> {
    const notification = await this.notificationModel.markAsRead(id);
    if (notification) {
      // Update the notification in cache
      await this.cacheNotification(notification);
    }
    return notification;
  }

  async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.SYSTEM,
      title,
      message,
      metadata,
    });
  }

  async createOrderStatusNotification(
    userId: string,
    orderId: string,
    status: string,
    message: string
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.ORDER_STATUS,
      title: `Order ${status}`,
      message,
      metadata: { orderId, status },
    });
  }

  async createDeliveryUpdateNotification(
    userId: string,
    orderId: string,
    status: string,
    message: string
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.DELIVERY_UPDATE,
      title: `Delivery ${status}`,
      message,
      metadata: { orderId, status },
    });
  }

  private async cacheNotification(notification: Notification): Promise<void> {
    const key = `notification:${notification.id}`;
    await this.redisClient.set(key, JSON.stringify(notification), {
      EX: 3600, // Cache for 1 hour
    });
  }

  private async cacheUserNotifications(
    userId: string,
    notifications: Notification[]
  ): Promise<void> {
    const key = `user:${userId}:notifications`;
    await this.redisClient.set(key, JSON.stringify(notifications), {
      EX: 3600, // Cache for 1 hour
    });
  }

  private async getCachedNotifications(
    userId: string
  ): Promise<Notification[] | null> {
    const key = `user:${userId}:notifications`;
    const cached = await this.redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  }
}
