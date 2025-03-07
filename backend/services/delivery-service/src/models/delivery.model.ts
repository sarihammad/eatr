import { Pool } from "pg";

export enum DeliveryStatus {
  PENDING = "PENDING",
  ASSIGNED = "ASSIGNED",
  PICKED_UP = "PICKED_UP",
  IN_TRANSIT = "IN_TRANSIT",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  driverId?: string;
  restaurantLocation: Location;
  deliveryLocation: Location;
  status: DeliveryStatus;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Driver {
  id: string;
  userId: string;
  vehicleType: string;
  vehicleNumber: string;
  currentLocation?: Location;
  isAvailable: boolean;
  currentDeliveryId?: string;
  rating: number;
  totalDeliveries: number;
}

export interface CreateDeliveryDTO {
  orderId: string;
  restaurantLocation: Location;
  deliveryLocation: Location;
  notes?: string;
}

export interface UpdateDeliveryStatusDTO {
  status: DeliveryStatus;
  driverId?: string;
  currentLocation?: Location;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
}

export interface UpdateDriverLocationDTO {
  latitude: number;
  longitude: number;
  address: string;
}

export class DeliveryModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createDelivery(deliveryData: CreateDeliveryDTO): Promise<Delivery> {
    const query = `
      INSERT INTO deliveries (
        order_id, restaurant_location, delivery_location,
        status, notes
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      deliveryData.orderId,
      deliveryData.restaurantLocation,
      deliveryData.deliveryLocation,
      DeliveryStatus.PENDING,
      deliveryData.notes,
    ];

    const result = await this.pool.query(query, values);
    return this.mapDBDeliveryToDelivery(result.rows[0]);
  }

  async findById(id: string): Promise<Delivery | null> {
    const query = "SELECT * FROM deliveries WHERE id = $1";
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDBDeliveryToDelivery(result.rows[0]);
  }

  async findByOrderId(orderId: string): Promise<Delivery | null> {
    const query = "SELECT * FROM deliveries WHERE order_id = $1";
    const result = await this.pool.query(query, [orderId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDBDeliveryToDelivery(result.rows[0]);
  }

  async findByDriverId(driverId: string): Promise<Delivery[]> {
    const query = "SELECT * FROM deliveries WHERE driver_id = $1";
    const result = await this.pool.query(query, [driverId]);
    return result.rows.map((row) => this.mapDBDeliveryToDelivery(row));
  }

  async updateDeliveryStatus(
    id: string,
    updateData: UpdateDeliveryStatusDTO
  ): Promise<Delivery | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateData.status) {
      updates.push(`status = $${paramCount}`);
      values.push(updateData.status);
      paramCount++;
    }

    if (updateData.driverId) {
      updates.push(`driver_id = $${paramCount}`);
      values.push(updateData.driverId);
      paramCount++;
    }

    if (updateData.currentLocation) {
      updates.push(`current_location = $${paramCount}`);
      values.push(updateData.currentLocation);
      paramCount++;
    }

    if (updateData.estimatedDeliveryTime) {
      updates.push(`estimated_delivery_time = $${paramCount}`);
      values.push(updateData.estimatedDeliveryTime);
      paramCount++;
    }

    if (updateData.actualDeliveryTime) {
      updates.push(`actual_delivery_time = $${paramCount}`);
      values.push(updateData.actualDeliveryTime);
      paramCount++;
    }

    if (updates.length === 0) {
      return null;
    }

    values.push(id);
    const query = `
      UPDATE deliveries
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDBDeliveryToDelivery(result.rows[0]);
  }

  async findAvailableDrivers(
    location: Location,
    radius: number
  ): Promise<Driver[]> {
    const query = `
      SELECT * FROM drivers
      WHERE is_available = true
      AND ST_DWithin(
        ST_MakePoint(current_location->>'longitude', current_location->>'latitude')::geography,
        ST_MakePoint($1, $2)::geography,
        $3
      )
      ORDER BY rating DESC
    `;

    const values = [location.longitude, location.latitude, radius];
    const result = await this.pool.query(query, values);
    return result.rows.map((row) => this.mapDBDriverToDriver(row));
  }

  async updateDriverLocation(
    driverId: string,
    location: UpdateDriverLocationDTO
  ): Promise<Driver | null> {
    const query = `
      UPDATE drivers
      SET current_location = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const values = [location, driverId];
    const result = await this.pool.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDBDriverToDriver(result.rows[0]);
  }

  async updateDriverAvailability(
    driverId: string,
    isAvailable: boolean
  ): Promise<Driver | null> {
    const query = `
      UPDATE drivers
      SET is_available = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const values = [isAvailable, driverId];
    const result = await this.pool.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDBDriverToDriver(result.rows[0]);
  }

  private mapDBDeliveryToDelivery(dbDelivery: any): Delivery {
    return {
      id: dbDelivery.id,
      orderId: dbDelivery.order_id,
      driverId: dbDelivery.driver_id,
      restaurantLocation: dbDelivery.restaurant_location,
      deliveryLocation: dbDelivery.delivery_location,
      status: dbDelivery.status as DeliveryStatus,
      estimatedDeliveryTime: dbDelivery.estimated_delivery_time,
      actualDeliveryTime: dbDelivery.actual_delivery_time,
      notes: dbDelivery.notes,
      createdAt: dbDelivery.created_at,
      updatedAt: dbDelivery.updated_at,
    };
  }

  private mapDBDriverToDriver(dbDriver: any): Driver {
    return {
      id: dbDriver.id,
      userId: dbDriver.user_id,
      vehicleType: dbDriver.vehicle_type,
      vehicleNumber: dbDriver.vehicle_number,
      currentLocation: dbDriver.current_location,
      isAvailable: dbDriver.is_available,
      currentDeliveryId: dbDriver.current_delivery_id,
      rating: dbDriver.rating,
      totalDeliveries: dbDriver.total_deliveries,
    };
  }
}
