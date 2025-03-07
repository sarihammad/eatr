import { Pool } from "pg";

export enum PaymentStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum PaymentMethod {
  CREDIT_CARD = "CREDIT_CARD",
  DEBIT_CARD = "DEBIT_CARD",
  PAYPAL = "PAYPAL",
  APPLE_PAY = "APPLE_PAY",
  GOOGLE_PAY = "GOOGLE_PAY",
}

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;
  errorMessage?: string;
  refundId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentDTO {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  paymentMethodId: string;
}

export interface RefundPaymentDTO {
  amount: number;
  reason: string;
}

export class PaymentModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createPayment(paymentData: CreatePaymentDTO): Promise<Payment> {
    const query = `
      INSERT INTO payments (
        order_id, user_id, amount, currency,
        status, method
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      paymentData.orderId,
      paymentData.userId,
      paymentData.amount,
      paymentData.currency,
      PaymentStatus.PENDING,
      paymentData.method,
    ];

    const result = await this.pool.query(query, values);
    return this.mapDBPaymentToPayment(result.rows[0]);
  }

  async findById(id: string): Promise<Payment | null> {
    const query = "SELECT * FROM payments WHERE id = $1";
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDBPaymentToPayment(result.rows[0]);
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    const query = "SELECT * FROM payments WHERE order_id = $1";
    const result = await this.pool.query(query, [orderId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDBPaymentToPayment(result.rows[0]);
  }

  async updatePaymentStatus(
    id: string,
    status: PaymentStatus,
    updates: {
      transactionId?: string;
      errorMessage?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<Payment | null> {
    const query = `
      UPDATE payments
      SET status = $1,
          transaction_id = COALESCE($2, transaction_id),
          error_message = COALESCE($3, error_message),
          metadata = COALESCE($4, metadata),
          updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;

    const values = [
      status,
      updates.transactionId,
      updates.errorMessage,
      updates.metadata,
      id,
    ];

    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDBPaymentToPayment(result.rows[0]);
  }

  async refundPayment(
    id: string,
    refundData: RefundPaymentDTO
  ): Promise<Payment | null> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      // Create refund record
      const refundQuery = `
        INSERT INTO refunds (
          payment_id, amount, reason
        ) VALUES ($1, $2, $3)
        RETURNING id
      `;

      const refundResult = await client.query(refundQuery, [
        id,
        refundData.amount,
        refundData.reason,
      ]);

      // Update payment status
      const updateQuery = `
        UPDATE payments
        SET status = $1,
            refund_id = $2,
            updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, [
        PaymentStatus.REFUNDED,
        refundResult.rows[0].id,
        id,
      ]);

      await client.query("COMMIT");

      return this.mapDBPaymentToPayment(updateResult.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private mapDBPaymentToPayment(dbPayment: any): Payment {
    return {
      id: dbPayment.id,
      orderId: dbPayment.order_id,
      userId: dbPayment.user_id,
      amount: dbPayment.amount,
      currency: dbPayment.currency,
      status: dbPayment.status as PaymentStatus,
      method: dbPayment.method as PaymentMethod,
      transactionId: dbPayment.transaction_id,
      errorMessage: dbPayment.error_message,
      refundId: dbPayment.refund_id,
      metadata: dbPayment.metadata,
      createdAt: dbPayment.created_at,
      updatedAt: dbPayment.updated_at,
    };
  }
}
