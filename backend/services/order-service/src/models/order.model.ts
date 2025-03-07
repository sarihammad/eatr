import { Pool } from "pg";

export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  PREPARING = "PREPARING",
  READY_FOR_PICKUP = "READY_FOR_PICKUP",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  status: OrderStatus;
  totalAmount: number;
  deliveryAddress: string;
  deliveryInstructions?: string;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  driverId?: string;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderDTO {
  userId: string;
  restaurantId: string;
  items: {
    menuItemId: string;
    quantity: number;
    specialInstructions?: string;
  }[];
  deliveryAddress: string;
  deliveryInstructions?: string;
}

export interface UpdateOrderStatusDTO {
  status: OrderStatus;
  driverId?: string;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
}

export class OrderModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createOrder(orderData: CreateOrderDTO): Promise<Order> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      // Create order
      const orderQuery = `
        INSERT INTO orders (
          user_id, restaurant_id, status, total_amount,
          delivery_address, delivery_instructions
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const orderValues = [
        orderData.userId,
        orderData.restaurantId,
        OrderStatus.PENDING,
        0, // Initial total amount, will be updated after adding items
        orderData.deliveryAddress,
        orderData.deliveryInstructions,
      ];

      const orderResult = await client.query(orderQuery, orderValues);
      const order = orderResult.rows[0];

      // Create order items
      let totalAmount = 0;
      const items: OrderItem[] = [];

      for (const item of orderData.items) {
        const itemQuery = `
          INSERT INTO order_items (
            order_id, menu_item_id, quantity, price, special_instructions
          ) VALUES ($1, $2, $3, (
            SELECT price FROM menu_items WHERE id = $2
          ), $4)
          RETURNING *
        `;

        const itemValues = [
          order.id,
          item.menuItemId,
          item.quantity,
          item.specialInstructions,
        ];

        const itemResult = await client.query(itemQuery, itemValues);
        const orderItem = itemResult.rows[0];
        totalAmount += orderItem.price * orderItem.quantity;
        items.push(this.mapDBOrderItemToOrderItem(orderItem));
      }

      // Update order total amount
      const updateQuery = `
        UPDATE orders SET total_amount = $1
        WHERE id = $2
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, [
        totalAmount,
        order.id,
      ]);
      const updatedOrder = updateResult.rows[0];

      await client.query("COMMIT");

      return {
        ...this.mapDBOrderToOrder(updatedOrder),
        items,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<Order | null> {
    const orderQuery = "SELECT * FROM orders WHERE id = $1";
    const orderResult = await this.pool.query(orderQuery, [id]);

    if (orderResult.rows.length === 0) {
      return null;
    }

    const itemsQuery = "SELECT * FROM order_items WHERE order_id = $1";
    const itemsResult = await this.pool.query(itemsQuery, [id]);

    return {
      ...this.mapDBOrderToOrder(orderResult.rows[0]),
      items: itemsResult.rows.map((item) =>
        this.mapDBOrderItemToOrderItem(item)
      ),
    };
  }

  async findByUserId(userId: string): Promise<Order[]> {
    const orderQuery =
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC";
    const orderResult = await this.pool.query(orderQuery, [userId]);

    const orders = [];
    for (const order of orderResult.rows) {
      const itemsQuery = "SELECT * FROM order_items WHERE order_id = $1";
      const itemsResult = await this.pool.query(itemsQuery, [order.id]);

      orders.push({
        ...this.mapDBOrderToOrder(order),
        items: itemsResult.rows.map((item) =>
          this.mapDBOrderItemToOrderItem(item)
        ),
      });
    }

    return orders;
  }

  async findByRestaurantId(restaurantId: string): Promise<Order[]> {
    const orderQuery =
      "SELECT * FROM orders WHERE restaurant_id = $1 ORDER BY created_at DESC";
    const orderResult = await this.pool.query(orderQuery, [restaurantId]);

    const orders = [];
    for (const order of orderResult.rows) {
      const itemsQuery = "SELECT * FROM order_items WHERE order_id = $1";
      const itemsResult = await this.pool.query(itemsQuery, [order.id]);

      orders.push({
        ...this.mapDBOrderToOrder(order),
        items: itemsResult.rows.map((item) =>
          this.mapDBOrderItemToOrderItem(item)
        ),
      });
    }

    return orders;
  }

  async updateOrderStatus(
    id: string,
    updateData: UpdateOrderStatusDTO
  ): Promise<Order | null> {
    const updateQuery = `
      UPDATE orders
      SET status = $1,
          driver_id = $2,
          estimated_delivery_time = $3,
          actual_delivery_time = $4,
          updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;

    const values = [
      updateData.status,
      updateData.driverId,
      updateData.estimatedDeliveryTime,
      updateData.actualDeliveryTime,
      id,
    ];

    const orderResult = await this.pool.query(updateQuery, values);
    if (orderResult.rows.length === 0) {
      return null;
    }

    const itemsQuery = "SELECT * FROM order_items WHERE order_id = $1";
    const itemsResult = await this.pool.query(itemsQuery, [id]);

    return {
      ...this.mapDBOrderToOrder(orderResult.rows[0]),
      items: itemsResult.rows.map((item) =>
        this.mapDBOrderItemToOrderItem(item)
      ),
    };
  }

  private mapDBOrderToOrder(dbOrder: any): Order {
    return {
      id: dbOrder.id,
      userId: dbOrder.user_id,
      restaurantId: dbOrder.restaurant_id,
      status: dbOrder.status as OrderStatus,
      totalAmount: dbOrder.total_amount,
      deliveryAddress: dbOrder.delivery_address,
      deliveryInstructions: dbOrder.delivery_instructions,
      estimatedDeliveryTime: dbOrder.estimated_delivery_time,
      actualDeliveryTime: dbOrder.actual_delivery_time,
      driverId: dbOrder.driver_id,
      items: [],
      createdAt: dbOrder.created_at,
      updatedAt: dbOrder.updated_at,
    };
  }

  private mapDBOrderItemToOrderItem(dbItem: any): OrderItem {
    return {
      id: dbItem.id,
      orderId: dbItem.order_id,
      menuItemId: dbItem.menu_item_id,
      quantity: dbItem.quantity,
      price: dbItem.price,
      specialInstructions: dbItem.special_instructions,
    };
  }
}
