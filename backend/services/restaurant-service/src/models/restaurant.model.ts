import { Pool } from "pg";

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  cuisine: string;
  rating: number;
  priceRange: string;
  imageUrl: string;
  isActive: boolean;
  openingHours: string;
  deliveryRadius: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRestaurantDTO {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  cuisine: string;
  priceRange: string;
  imageUrl: string;
  openingHours: string;
  deliveryRadius: number;
}

export interface CreateMenuItemDTO {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
}

export class RestaurantModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createRestaurant(
    restaurantData: CreateRestaurantDTO
  ): Promise<Restaurant> {
    const query = `
      INSERT INTO restaurants (
        name, description, address, phone, email, cuisine,
        price_range, image_url, opening_hours, delivery_radius,
        is_active, rating
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      restaurantData.name,
      restaurantData.description,
      restaurantData.address,
      restaurantData.phone,
      restaurantData.email,
      restaurantData.cuisine,
      restaurantData.priceRange,
      restaurantData.imageUrl,
      restaurantData.openingHours,
      restaurantData.deliveryRadius,
      true, // isActive
      0, // initial rating
    ];

    const result = await this.pool.query(query, values);
    return this.mapDBRestaurantToRestaurant(result.rows[0]);
  }

  async findById(id: string): Promise<Restaurant | null> {
    const query = "SELECT * FROM restaurants WHERE id = $1";
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDBRestaurantToRestaurant(result.rows[0]);
  }

  async findAll(filters: {
    cuisine?: string;
    priceRange?: string;
    rating?: number;
    isActive?: boolean;
  }): Promise<Restaurant[]> {
    let query = "SELECT * FROM restaurants WHERE 1=1";
    const values: any[] = [];
    let paramCount = 1;

    if (filters.cuisine) {
      query += ` AND cuisine = $${paramCount}`;
      values.push(filters.cuisine);
      paramCount++;
    }

    if (filters.priceRange) {
      query += ` AND price_range = $${paramCount}`;
      values.push(filters.priceRange);
      paramCount++;
    }

    if (filters.rating) {
      query += ` AND rating >= $${paramCount}`;
      values.push(filters.rating);
      paramCount++;
    }

    if (filters.isActive !== undefined) {
      query += ` AND is_active = $${paramCount}`;
      values.push(filters.isActive);
      paramCount++;
    }

    const result = await this.pool.query(query, values);
    return result.rows.map((row) => this.mapDBRestaurantToRestaurant(row));
  }

  async updateRestaurant(
    id: string,
    restaurantData: Partial<CreateRestaurantDTO>
  ): Promise<Restaurant | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(restaurantData).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${this.toSnakeCase(key)} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return null;
    }

    values.push(id);
    const query = `
      UPDATE restaurants 
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDBRestaurantToRestaurant(result.rows[0]);
  }

  async createMenuItem(
    restaurantId: string,
    menuItemData: CreateMenuItemDTO
  ): Promise<MenuItem> {
    const query = `
      INSERT INTO menu_items (
        restaurant_id, name, description, price,
        category, image_url, is_available
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      restaurantId,
      menuItemData.name,
      menuItemData.description,
      menuItemData.price,
      menuItemData.category,
      menuItemData.imageUrl,
      menuItemData.isAvailable,
    ];

    const result = await this.pool.query(query, values);
    return this.mapDBMenuItemToMenuItem(result.rows[0]);
  }

  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    const query = "SELECT * FROM menu_items WHERE restaurant_id = $1";
    const result = await this.pool.query(query, [restaurantId]);
    return result.rows.map((row) => this.mapDBMenuItemToMenuItem(row));
  }

  async updateMenuItem(
    id: string,
    menuItemData: Partial<CreateMenuItemDTO>
  ): Promise<MenuItem | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(menuItemData).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${this.toSnakeCase(key)} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return null;
    }

    values.push(id);
    const query = `
      UPDATE menu_items 
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDBMenuItemToMenuItem(result.rows[0]);
  }

  private mapDBRestaurantToRestaurant(dbRestaurant: any): Restaurant {
    return {
      id: dbRestaurant.id,
      name: dbRestaurant.name,
      description: dbRestaurant.description,
      address: dbRestaurant.address,
      phone: dbRestaurant.phone,
      email: dbRestaurant.email,
      cuisine: dbRestaurant.cuisine,
      rating: dbRestaurant.rating,
      priceRange: dbRestaurant.price_range,
      imageUrl: dbRestaurant.image_url,
      isActive: dbRestaurant.is_active,
      openingHours: dbRestaurant.opening_hours,
      deliveryRadius: dbRestaurant.delivery_radius,
      createdAt: dbRestaurant.created_at,
      updatedAt: dbRestaurant.updated_at,
    };
  }

  private mapDBMenuItemToMenuItem(dbMenuItem: any): MenuItem {
    return {
      id: dbMenuItem.id,
      restaurantId: dbMenuItem.restaurant_id,
      name: dbMenuItem.name,
      description: dbMenuItem.description,
      price: dbMenuItem.price,
      category: dbMenuItem.category,
      imageUrl: dbMenuItem.image_url,
      isAvailable: dbMenuItem.is_available,
      createdAt: dbMenuItem.created_at,
      updatedAt: dbMenuItem.updated_at,
    };
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}
