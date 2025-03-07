import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();
const orderController = new OrderController();

// User routes
router.post("/", auth, orderController.createOrder);
router.get("/user", auth, orderController.getUserOrders);
router.get("/:id", auth, orderController.getOrder);

// Restaurant routes
router.get(
  "/restaurant/:restaurantId",
  auth,
  orderController.getRestaurantOrders
);

// Status update routes
router.patch("/:id/status", auth, orderController.updateOrderStatus);

export default router;
