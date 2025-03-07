import express from "express";
import cors from "cors";
import { Kafka } from "kafkajs";
import { Pool } from "pg";
import { createPaymentRoutes } from "./routes/payment.routes";
import { PaymentController } from "./controllers/payment.controller";
import { PaymentModel } from "./models/payment.model";
import { PaymentService } from "./services/payment.service";
import { PaymentProducer } from "./kafka/payment.producer";
import { PaymentConsumer } from "./kafka/payment.consumer";

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
  clientId: "payment-service",
  brokers: (process.env.KAFKA_BROKERS || "").split(","),
});

// Initialize services
const paymentModel = new PaymentModel(pool);
const paymentService = new PaymentService(process.env.STRIPE_SECRET_KEY || "");
const paymentProducer = new PaymentProducer(kafka);
const paymentConsumer = new PaymentConsumer(
  kafka,
  paymentModel,
  paymentService,
  paymentProducer
);

// Initialize controller
const paymentController = new PaymentController(
  paymentModel,
  paymentService,
  paymentProducer
);

// Routes
app.use("/api", createPaymentRoutes(paymentController));

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
    await paymentProducer.connect();
    await paymentConsumer.connect();
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
    await paymentProducer.disconnect();
    await paymentConsumer.disconnect();
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
