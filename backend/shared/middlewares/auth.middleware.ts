import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from './error.middleware';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const verifyToken = (token: string, secret: string): AuthUser => {
  try {
    return jwt.verify(token, secret) as AuthUser;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token');
    }
    throw error;
  }
};

export const generateToken = (
  payload: AuthUser,
  secret: string,
  expiresIn: string = '24h'
): string => {
  return jwt.sign(payload, secret, { expiresIn });
};

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const user = verifyToken(token, jwtSecret);
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Authentication failed' });
    }
  }
};

export const authorize =
  (...allowedRoles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('User not authenticated');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new AuthorizationError(
          'You do not have permission to perform this action'
        );
      }

      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(401).json({ error: error.message });
      } else if (error instanceof AuthorizationError) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Authorization failed' });
      }
    }
  }; 