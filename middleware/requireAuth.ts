import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_SECRET!;

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Debug: Log all cookies received
    console.log("All cookies:", req.cookies);
    console.log("Access token cookie:", req.cookies.accessToken);
    
    const token = req.cookies.accessToken; // ONLY check cookie

    if (!token) {
      console.log("No access token found in cookies");
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, ACCESS_SECRET) as { userId: string };
    (req as any).userId = decoded.userId;

    next();
  } catch (error) {
    console.log("JWT verification error:", error);
    return res.status(401).json({ message: "Invalid or expired token", error });
  }
};
