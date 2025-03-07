import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { UserModel, CreateUserDTO } from "../models/user.model";
import { generateAuthToken } from "../middlewares/auth.middleware";
import pool from "../config/database";

export class UserController {
  private userModel: UserModel;

  constructor() {
    this.userModel = new UserModel(pool);
  }

  register = async (req: Request, res: Response) => {
    try {
      const userData: CreateUserDTO = req.body;

      // Check if user already exists
      const existingUser = await this.userModel.findByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Create new user
      const user = await this.userModel.createUser(userData);
      const token = generateAuthToken(user.id);

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          address: user.address,
        },
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Error registering user" });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await this.userModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid login credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid login credentials" });
      }

      const token = generateAuthToken(user.id);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          address: user.address,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Error logging in" });
    }
  };

  getProfile = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address: user.address,
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Error fetching profile" });
    }
  };

  updateProfile = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const updates = req.body;

      // Remove sensitive fields
      delete updates.password;
      delete updates.email;

      const updatedUser = await this.userModel.updateUser(user.id, updates);
      if (!updatedUser) {
        return res.status(400).json({ error: "No valid updates provided" });
      }

      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        address: updatedUser.address,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Error updating profile" });
    }
  };
}
