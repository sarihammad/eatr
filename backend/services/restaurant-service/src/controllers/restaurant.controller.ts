import { Request, Response } from "express";
import {
  RestaurantModel,
  CreateRestaurantDTO,
  CreateMenuItemDTO,
} from "../models/restaurant.model";
import pool from "../config/database";
import { KafkaProducer } from "../kafka/restaurant.producer";

export class RestaurantController {
  private restaurantModel: RestaurantModel;
  private kafkaProducer: KafkaProducer;

  constructor() {
    this.restaurantModel = new RestaurantModel(pool);
    this.kafkaProducer = new KafkaProducer();
  }

  createRestaurant = async (req: Request, res: Response) => {
    try {
      const restaurantData: CreateRestaurantDTO = req.body;
      const restaurant = await this.restaurantModel.createRestaurant(
        restaurantData
      );

      // Publish event to Kafka
      await this.kafkaProducer.produceMessage("restaurant_created", {
        restaurantId: restaurant.id,
        name: restaurant.name,
        cuisine: restaurant.cuisine,
      });

      res.status(201).json(restaurant);
    } catch (error) {
      console.error("Create restaurant error:", error);
      res.status(500).json({ error: "Error creating restaurant" });
    }
  };

  getRestaurant = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const restaurant = await this.restaurantModel.findById(id);

      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      res.json(restaurant);
    } catch (error) {
      console.error("Get restaurant error:", error);
      res.status(500).json({ error: "Error fetching restaurant" });
    }
  };

  getAllRestaurants = async (req: Request, res: Response) => {
    try {
      const filters = {
        cuisine: req.query.cuisine as string,
        priceRange: req.query.priceRange as string,
        rating: req.query.rating ? Number(req.query.rating) : undefined,
        isActive: req.query.isActive === "true",
      };

      const restaurants = await this.restaurantModel.findAll(filters);
      res.json(restaurants);
    } catch (error) {
      console.error("Get all restaurants error:", error);
      res.status(500).json({ error: "Error fetching restaurants" });
    }
  };

  updateRestaurant = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const restaurantData = req.body;

      const updatedRestaurant = await this.restaurantModel.updateRestaurant(
        id,
        restaurantData
      );
      if (!updatedRestaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      // Publish event to Kafka
      await this.kafkaProducer.produceMessage("restaurant_updated", {
        restaurantId: updatedRestaurant.id,
        updates: restaurantData,
      });

      res.json(updatedRestaurant);
    } catch (error) {
      console.error("Update restaurant error:", error);
      res.status(500).json({ error: "Error updating restaurant" });
    }
  };

  createMenuItem = async (req: Request, res: Response) => {
    try {
      const { restaurantId } = req.params;
      const menuItemData: CreateMenuItemDTO = req.body;

      const restaurant = await this.restaurantModel.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      const menuItem = await this.restaurantModel.createMenuItem(
        restaurantId,
        menuItemData
      );

      // Publish event to Kafka
      await this.kafkaProducer.produceMessage("menu_item_created", {
        restaurantId,
        menuItemId: menuItem.id,
        name: menuItem.name,
      });

      res.status(201).json(menuItem);
    } catch (error) {
      console.error("Create menu item error:", error);
      res.status(500).json({ error: "Error creating menu item" });
    }
  };

  getMenuItems = async (req: Request, res: Response) => {
    try {
      const { restaurantId } = req.params;

      const restaurant = await this.restaurantModel.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      const menuItems = await this.restaurantModel.getMenuItems(restaurantId);
      res.json(menuItems);
    } catch (error) {
      console.error("Get menu items error:", error);
      res.status(500).json({ error: "Error fetching menu items" });
    }
  };

  updateMenuItem = async (req: Request, res: Response) => {
    try {
      const { restaurantId, menuItemId } = req.params;
      const menuItemData = req.body;

      const restaurant = await this.restaurantModel.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      const updatedMenuItem = await this.restaurantModel.updateMenuItem(
        menuItemId,
        menuItemData
      );
      if (!updatedMenuItem) {
        return res.status(404).json({ error: "Menu item not found" });
      }

      // Publish event to Kafka
      await this.kafkaProducer.produceMessage("menu_item_updated", {
        restaurantId,
        menuItemId,
        updates: menuItemData,
      });

      res.json(updatedMenuItem);
    } catch (error) {
      console.error("Update menu item error:", error);
      res.status(500).json({ error: "Error updating menu item" });
    }
  };
}
