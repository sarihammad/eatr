import { Request, Response } from "express";
import {
  OrderModel,
  CreateOrderDTO,
  UpdateOrderStatusDTO,
} from "../models/order.model";
import { OrderProducer } from "../kafka/order.producer";
import pool from "../config/database";

export class OrderController {
  private orderModel: OrderModel;
  private orderProducer: OrderProducer;

  constructor() {
    this.orderModel = new OrderModel(pool);
    this.orderProducer = new OrderProducer();
  }

  createOrder = async (req: Request, res: Response) => {
    try {
      const orderData: CreateOrderDTO = {
        ...req.body,
        userId: (req as any).user.id,
      };

      const order = await this.orderModel.createOrder(orderData);

      // Notify other services about the new order
      await this.orderProducer.notifyOrderCreated(order);

      res.status(201).json(order);
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ error: "Error creating order" });
    }
  };

  getOrder = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const order = await this.orderModel.findById(id);

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Check if user has permission to view this order
      const userId = (req as any).user.id;
      if (order.userId !== userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to view this order" });
      }

      res.json(order);
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ error: "Error fetching order" });
    }
  };

  getUserOrders = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const orders = await this.orderModel.findByUserId(userId);
      res.json(orders);
    } catch (error) {
      console.error("Get user orders error:", error);
      res.status(500).json({ error: "Error fetching orders" });
    }
  };

  getRestaurantOrders = async (req: Request, res: Response) => {
    try {
      const { restaurantId } = req.params;
      const orders = await this.orderModel.findByRestaurantId(restaurantId);
      res.json(orders);
    } catch (error) {
      console.error("Get restaurant orders error:", error);
      res.status(500).json({ error: "Error fetching restaurant orders" });
    }
  };

  updateOrderStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData: UpdateOrderStatusDTO = req.body;

      const updatedOrder = await this.orderModel.updateOrderStatus(
        id,
        updateData
      );
      if (!updatedOrder) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Notify other services about the status update
      await this.orderProducer.notifyOrderStatusUpdated(updatedOrder);

      res.json(updatedOrder);
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ error: "Error updating order status" });
    }
  };
}
