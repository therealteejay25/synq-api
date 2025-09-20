import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_SECRET!;

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.accessToken; // ONLY check cookie

    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, ACCESS_SECRET) as { userId: string };
    (req as any).userId = decoded.userId;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token", error });
  }
};
