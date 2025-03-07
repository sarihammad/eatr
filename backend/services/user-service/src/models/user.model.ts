import { Pool } from "pg";
import bcrypt from "bcryptjs";

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
}

export class UserModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createUser(userData: CreateUserDTO): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const query = `
      INSERT INTO users (
        email, password, first_name, last_name, phone, address
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      userData.email,
      hashedPassword,
      userData.firstName,
      userData.lastName,
      userData.phone,
      userData.address,
    ];

    const result = await this.pool.query(query, values);
    return this.mapDBUserToUser(result.rows[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await this.pool.query(query, [email]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDBUserToUser(result.rows[0]);
  }

  async findById(id: string): Promise<User | null> {
    const query = "SELECT * FROM users WHERE id = $1";
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDBUserToUser(result.rows[0]);
  }

  async updateUser(
    id: string,
    userData: Partial<CreateUserDTO>
  ): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(userData).forEach(([key, value]) => {
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
      UPDATE users 
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return this.mapDBUserToUser(result.rows[0]);
  }

  private mapDBUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      password: dbUser.password,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      phone: dbUser.phone,
      address: dbUser.address,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
    };
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}
