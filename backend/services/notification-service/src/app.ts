import "dotenv/config";
import express from "express";
import cors from "cors";
import { Pool } from "pg";
import { createClient } from "redis";
import { Kafka } from "kafkajs";
import { NotificationModel } from "./models/notification.model";
import { NotificationService } from "./services/notification.service";
import { NotificationController } from "./controllers/notification.controller";
import { createNotificationRoutes } from "./routes/notification.routes";
import { NotificationConsumer } from "./kafka/notification.consumer";
import { NotificationProducer } from "./kafka/notification.producer";

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Redis configuration
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

// Kafka configuration
const kafka = new Kafka({
  clientId: "notification-service",
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
});

// Initialize dependencies
const notificationModel = new NotificationModel(pool);
const notificationService = new NotificationService(
  notificationModel,
  redisClient
);
const notificationProducer = new NotificationProducer(kafka);
const notificationConsumer = new NotificationConsumer(
  kafka,
  notificationService
);
const notificationController = new NotificationController(
  notificationService,
  notificationProducer
);

// Routes
app.use("/api", createNotificationRoutes(notificationController));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// Connect to Redis
async function connectToRedis() {
  try {
    await redisClient.connect();
    console.log("Connected to Redis");
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
    process.exit(1);
  }
}

// Connect to Kafka
async function connectToKafka() {
  try {
    await notificationProducer.connect();
    await notificationConsumer.connect();
    console.log("Connected to Kafka");
  } catch (error) {
    console.error("Failed to connect to Kafka:", error);
    process.exit(1);
  }
}

// Initialize connections
connectToRedis();
connectToKafka();

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received. Closing connections...");

  try {
    await redisClient.quit();
    await pool.end();
    await notificationProducer.disconnect();
    await notificationConsumer.disconnect();
    console.log("Connections closed gracefully");
    process.exit(0);
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
});

export default app;
