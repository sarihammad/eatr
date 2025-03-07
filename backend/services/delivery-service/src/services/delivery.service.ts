import {
  DeliveryModel,
  Delivery,
  Driver,
  Location,
  DeliveryStatus,
} from "../models/delivery.model";

export class DeliveryService {
  private deliveryModel: DeliveryModel;
  private readonly SEARCH_RADIUS_KM = 5; // Initial search radius in kilometers
  private readonly MAX_SEARCH_RADIUS_KM = 20; // Maximum search radius
  private readonly RADIUS_INCREMENT_KM = 5; // How much to increase radius in each iteration

  constructor(deliveryModel: DeliveryModel) {
    this.deliveryModel = deliveryModel;
  }

  async assignDriver(delivery: Delivery): Promise<Delivery | null> {
    let searchRadius = this.SEARCH_RADIUS_KM;
    let driver: Driver | null = null;

    // Incrementally increase search radius until we find a driver or hit max radius
    while (searchRadius <= this.MAX_SEARCH_RADIUS_KM && !driver) {
      const availableDrivers = await this.deliveryModel.findAvailableDrivers(
        delivery.restaurantLocation,
        searchRadius * 1000 // Convert to meters
      );

      if (availableDrivers.length > 0) {
        // Select the highest-rated driver within range
        driver = availableDrivers[0]; // Already sorted by rating in the query
      }

      searchRadius += this.RADIUS_INCREMENT_KM;
    }

    if (!driver) {
      return null;
    }

    // Calculate estimated delivery time
    const estimatedDeliveryTime = this.calculateEstimatedDeliveryTime(
      driver.currentLocation!,
      delivery.restaurantLocation,
      delivery.deliveryLocation
    );

    // Update delivery with assigned driver and estimated time
    const updatedDelivery = await this.deliveryModel.updateDeliveryStatus(
      delivery.id,
      {
        status: DeliveryStatus.ASSIGNED,
        driverId: driver.id,
        estimatedDeliveryTime,
      }
    );

    if (updatedDelivery) {
      // Update driver's availability and current delivery
      await this.deliveryModel.updateDriverAvailability(driver.id, false);
    }

    return updatedDelivery;
  }

  async getDriver(driverId: string): Promise<Driver | null> {
    const drivers = await this.deliveryModel.findAvailableDrivers(
      { latitude: 0, longitude: 0, address: "" }, // Dummy location as we're searching by ID
      Number.MAX_SAFE_INTEGER
    );
    return drivers.find((driver) => driver.id === driverId) || null;
  }

  async updateDeliveryStatus(
    deliveryId: string,
    status: DeliveryStatus,
    location?: Location
  ): Promise<Delivery | null> {
    const delivery = await this.deliveryModel.findById(deliveryId);
    if (!delivery) {
      return null;
    }

    const updates: any = { status };
    if (location) {
      updates.currentLocation = location;
    }

    if (status === DeliveryStatus.DELIVERED) {
      updates.actualDeliveryTime = new Date();
    }

    const updatedDelivery = await this.deliveryModel.updateDeliveryStatus(
      deliveryId,
      updates
    );

    // If delivery is complete or cancelled, free up the driver
    if (
      updatedDelivery &&
      (status === DeliveryStatus.DELIVERED ||
        status === DeliveryStatus.CANCELLED ||
        status === DeliveryStatus.FAILED)
    ) {
      await this.deliveryModel.updateDriverAvailability(
        updatedDelivery.driverId!,
        true
      );
    }

    return updatedDelivery;
  }

  private calculateEstimatedDeliveryTime(
    driverLocation: Location,
    restaurantLocation: Location,
    deliveryLocation: Location
  ): Date {
    // Calculate distances
    const distanceToRestaurant = this.calculateDistance(
      driverLocation,
      restaurantLocation
    );
    const distanceToDelivery = this.calculateDistance(
      restaurantLocation,
      deliveryLocation
    );

    // Assume average speed of 30 km/h in city traffic
    const averageSpeedKmH = 30;

    // Calculate total time in hours
    const timeToRestaurantHours = distanceToRestaurant / averageSpeedKmH;
    const timeToDeliveryHours = distanceToDelivery / averageSpeedKmH;

    // Add 10 minutes for pickup and 5 minutes for delivery
    const pickupTimeHours = 10 / 60;
    const deliveryTimeHours = 5 / 60;

    // Calculate total time in milliseconds
    const totalTimeMs =
      (timeToRestaurantHours +
        timeToDeliveryHours +
        pickupTimeHours +
        deliveryTimeHours) *
      60 *
      60 *
      1000;

    // Return estimated delivery time
    return new Date(Date.now() + totalTimeMs);
  }

  private calculateDistance(point1: Location, point2: Location): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(point2.latitude - point1.latitude);
    const dLon = this.toRad(point2.longitude - point1.longitude);
    const lat1 = this.toRad(point1.latitude);
    const lat2 = this.toRad(point2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
