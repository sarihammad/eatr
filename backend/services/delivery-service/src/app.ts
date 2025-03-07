import express from "express";
import cors from "cors";
import { Kafka } from "kafkajs";
import { Pool } from "pg";
import { createDeliveryRoutes } from "./routes/delivery.routes";
import { DeliveryController } from "./controllers/delivery.controller";
import { DeliveryModel } from "./models/delivery.model";
import { DeliveryService } from "./services/delivery.service";
import { DeliveryProducer } from "./kafka/delivery.producer";
import { DeliveryConsumer } from "./kafka/delivery.consumer";

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Kafka setup
const kafka = new Kafka({
  clientId: "delivery-service",
  brokers: (process.env.KAFKA_BROKERS || "").split(","),
});

// Initialize services
const deliveryModel = new DeliveryModel(pool);
const deliveryService = new DeliveryService(deliveryModel);
const deliveryProducer = new DeliveryProducer(kafka);
const deliveryConsumer = new DeliveryConsumer(
  kafka,
  deliveryModel,
  deliveryService,
  deliveryProducer
);

// Initialize controller
const deliveryController = new DeliveryController(
  deliveryModel,
  deliveryService,
  deliveryProducer
);

// Routes
app.use("/api", createDeliveryRoutes(deliveryController));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
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
    res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
);

// Connect to Kafka
async function startKafka() {
  try {
    await deliveryProducer.connect();
    await deliveryConsumer.connect();
    console.log("Connected to Kafka");
  } catch (error) {
    console.error("Failed to connect to Kafka:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received. Closing HTTP server...");

  try {
    await deliveryProducer.disconnect();
    await deliveryConsumer.disconnect();
    await pool.end();
    console.log("Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
});

// Start Kafka connections
startKafka();

export default app;
