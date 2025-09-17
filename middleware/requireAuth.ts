import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.ACCESS_SECRET!;

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ")
      ? header.split(" ")[1]
      : req.cookies?.accessToken;

    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, ACCESS_SECRET) as { userId: string };
    (req as any).userId = decoded.userId;

    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
