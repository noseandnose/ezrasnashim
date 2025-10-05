import type { Request, Response, NextFunction } from "express";
import { env } from "../env";

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  if (!env.ADMIN_PASSWORD) {
    return res.status(500).json({
      message: "Admin authentication not configured"
    });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token || token !== env.ADMIN_PASSWORD) {
    return res.status(401).json({
      message: "Unauthorized: Invalid admin credentials"
    });
  }

  next();
}
