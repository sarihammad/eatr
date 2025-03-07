// Notification Model

import { Pool } from "pg";

export enum NotificationType {
  ORDER_STATUS = "ORDER_STATUS",
  DELIVERY_UPDATE = "DELIVERY_UPDATE",
  PAYMENT_STATUS = "PAYMENT_STATUS",
  PROMOTIONAL = "PROMOTIONAL",
  SYSTEM = "SYSTEM",
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

export interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export class NotificationModel {
  constructor(private pool: Pool) {}

  async create(data: CreateNotificationDTO): Promise<Notification> {
    const query = `
      INSERT INTO notifications (
        user_id, type, title, message, metadata, is_read
      ) VALUES ($1, $2, $3, $4, $5, false)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      data.userId,
      data.type,
      data.title,
      data.message,
      data.metadata,
    ]);

    return this.mapDBNotificationToNotification(result.rows[0]);
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    const query = `
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows.map(this.mapDBNotificationToNotification);
  }

  async markAsRead(id: string): Promise<Notification | null> {
    const query = `
      UPDATE notifications
      SET is_read = true
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return this.mapDBNotificationToNotification(result.rows[0]);
  }

  private mapDBNotificationToNotification(dbNotification: any): Notification {
    return {
      id: dbNotification.id,
      userId: dbNotification.user_id,
      type: dbNotification.type,
      title: dbNotification.title,
      message: dbNotification.message,
      metadata: dbNotification.metadata,
      isRead: dbNotification.is_read,
      createdAt: dbNotification.created_at,
    };
  }
}
