import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();
const userController = new UserController();

// Public routes
router.post("/register", userController.register);
router.post("/login", userController.login);

// Protected routes
router.get("/profile", auth, userController.getProfile);
router.patch("/profile", auth, userController.updateProfile);

export default router;
