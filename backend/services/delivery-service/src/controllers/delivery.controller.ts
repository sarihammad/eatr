import { Request, Response } from "express";
import {
  DeliveryModel,
  DeliveryStatus,
  CreateDeliveryDTO,
  UpdateDriverLocationDTO,
} from "../models/delivery.model";
import { DeliveryService } from "../services/delivery.service";
import { DeliveryProducer } from "../kafka/delivery.producer";

export class DeliveryController {
  constructor(
    private deliveryModel: DeliveryModel,
    private deliveryService: DeliveryService,
    private deliveryProducer: DeliveryProducer
  ) {}

  createDelivery = async (req: Request, res: Response): Promise<void> => {
    try {
      const deliveryData: CreateDeliveryDTO = req.body;
      const delivery = await this.deliveryModel.createDelivery(deliveryData);

      // Attempt to assign a driver
      const assignedDelivery = await this.deliveryService.assignDriver(
        delivery
      );
      if (assignedDelivery && assignedDelivery.driverId) {
        const driver = await this.deliveryService.getDriver(
          assignedDelivery.driverId
        );
        if (driver) {
          await this.deliveryProducer.sendDeliveryAssigned(
            assignedDelivery,
            driver
          );
        }
      }

      res.status(201).json(assignedDelivery || delivery);
    } catch (error) {
      console.error("Error creating delivery:", error);
      res.status(500).json({
        error: "Failed to create delivery",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  getDelivery = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const delivery = await this.deliveryModel.findById(id);

      if (!delivery) {
        res.status(404).json({ error: "Delivery not found" });
        return;
      }

      res.json(delivery);
    } catch (error) {
      console.error("Error fetching delivery:", error);
      res.status(500).json({
        error: "Failed to fetch delivery",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  getDeliveryByOrderId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const delivery = await this.deliveryModel.findByOrderId(orderId);

      if (!delivery) {
        res.status(404).json({ error: "Delivery not found" });
        return;
      }

      res.json(delivery);
    } catch (error) {
      console.error("Error fetching delivery by order ID:", error);
      res.status(500).json({
        error: "Failed to fetch delivery",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  updateDeliveryStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, location } = req.body;

      const updatedDelivery = await this.deliveryService.updateDeliveryStatus(
        id,
        status,
        location
      );

      if (!updatedDelivery) {
        res.status(404).json({ error: "Delivery not found" });
        return;
      }

      // Send appropriate Kafka event based on status
      switch (status) {
        case DeliveryStatus.PICKED_UP:
          await this.deliveryProducer.sendDeliveryPickedUp(updatedDelivery);
          break;
        case DeliveryStatus.IN_TRANSIT:
          await this.deliveryProducer.sendDeliveryInTransit(
            updatedDelivery,
            location
          );
          break;
        case DeliveryStatus.DELIVERED:
          await this.deliveryProducer.sendDeliveryCompleted(updatedDelivery);
          break;
        case DeliveryStatus.FAILED:
          await this.deliveryProducer.sendDeliveryFailed(
            updatedDelivery,
            req.body.reason
          );
          break;
      }

      res.json(updatedDelivery);
    } catch (error) {
      console.error("Error updating delivery status:", error);
      res.status(500).json({
        error: "Failed to update delivery status",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  updateDriverLocation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { driverId } = req.params;
      const locationData: UpdateDriverLocationDTO = req.body;

      const updatedDriver = await this.deliveryModel.updateDriverLocation(
        driverId,
        locationData
      );

      if (!updatedDriver) {
        res.status(404).json({ error: "Driver not found" });
        return;
      }

      // If driver is on an active delivery, update delivery status
      if (updatedDriver.currentDeliveryId) {
        const delivery = await this.deliveryModel.findById(
          updatedDriver.currentDeliveryId
        );
        if (delivery && delivery.status === DeliveryStatus.IN_TRANSIT) {
          await this.deliveryProducer.sendDeliveryInTransit(
            delivery,
            locationData
          );
        }
      }

      res.json(updatedDriver);
    } catch (error) {
      console.error("Error updating driver location:", error);
      res.status(500).json({
        error: "Failed to update driver location",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  getDriverDeliveries = async (req: Request, res: Response): Promise<void> => {
    try {
      const { driverId } = req.params;
      const deliveries = await this.deliveryModel.findByDriverId(driverId);
      res.json(deliveries);
    } catch (error) {
      console.error("Error fetching driver deliveries:", error);
      res.status(500).json({
        error: "Failed to fetch driver deliveries",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  updateDriverAvailability = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { driverId } = req.params;
      const { isAvailable } = req.body;

      const updatedDriver = await this.deliveryModel.updateDriverAvailability(
        driverId,
        isAvailable
      );

      if (!updatedDriver) {
        res.status(404).json({ error: "Driver not found" });
        return;
      }

      res.json(updatedDriver);
    } catch (error) {
      console.error("Error updating driver availability:", error);
      res.status(500).json({
        error: "Failed to update driver availability",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
