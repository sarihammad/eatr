import { Router } from "express";
import { RestaurantController } from "../controllers/restaurant.controller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();
const restaurantController = new RestaurantController();

// Restaurant routes
router.post("/", auth, restaurantController.createRestaurant);
router.get("/", restaurantController.getAllRestaurants);
router.get("/:id", restaurantController.getRestaurant);
router.patch("/:id", auth, restaurantController.updateRestaurant);

// Menu item routes
router.post(
  "/:restaurantId/menu-items",
  auth,
  restaurantController.createMenuItem
);
router.get("/:restaurantId/menu-items", restaurantController.getMenuItems);
router.patch(
  "/:restaurantId/menu-items/:menuItemId",
  auth,
  restaurantController.updateMenuItem
);

export default router;
