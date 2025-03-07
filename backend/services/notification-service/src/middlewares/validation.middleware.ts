import { Request, Response, NextFunction } from "express";
import { NotificationType } from "../models/notification.model";

export const validateNotification = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { userId, type, title, message } = req.body;

  // Check required fields
  if (!userId || !type || !title || !message) {
    res.status(400).json({
      error:
        "Missing required fields: userId, type, title, and message are required",
    });
    return;
  }

  // Validate notification type
  if (!Object.values(NotificationType).includes(type)) {
    res.status(400).json({
      error: `Invalid notification type. Must be one of: ${Object.values(
        NotificationType
      ).join(", ")}`,
    });
    return;
  }

  // Validate string lengths
  if (title.length > 100) {
    res.status(400).json({
      error: "Title must be 100 characters or less",
    });
    return;
  }

  if (message.length > 500) {
    res.status(400).json({
      error: "Message must be 500 characters or less",
    });
    return;
  }

  // Validate metadata if present
  if (req.body.metadata !== undefined) {
    if (
      typeof req.body.metadata !== "object" ||
      Array.isArray(req.body.metadata)
    ) {
      res.status(400).json({
        error: "Metadata must be an object",
      });
      return;
    }

    try {
      // Check if metadata can be stringified (to ensure it can be stored)
      JSON.stringify(req.body.metadata);
    } catch (error) {
      res.status(400).json({
        error: "Metadata must be JSON serializable",
      });
      return;
    }
  }

  next();
};
