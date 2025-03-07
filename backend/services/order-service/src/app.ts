import express from "express";
import cors from "cors";
import orderRoutes from "./routes/order.routes";
import { OrderConsumer } from "./kafka/order.consumer";
import pool from "./config/database";

const app = express();

// Initialize Kafka consumer
const orderConsumer = new OrderConsumer(pool);
orderConsumer.connect().catch(console.error);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/orders", orderRoutes);

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
    console.error(err.stack);
    res.status(500).json({ error: "Something broke!" });
  }
);

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Received SIGTERM. Performing graceful shutdown...");
  await orderConsumer.disconnect();
  process.exit(0);
});

export default app;
