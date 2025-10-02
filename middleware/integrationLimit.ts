import { Request, Response, NextFunction } from "express";
import Integration from "../models/Integration.ts";
import User from "../models/User.ts";

// Plan-based integration limits
const PLAN_LIMITS: Record<string, number | null> = {
  free: 4,
  pro: 8,
  premium: 10,
  team: null, // unlimited
};

export const enforceIntegrationLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId; // set by your auth middleware
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const limit = PLAN_LIMITS[user.plan];
    if (limit === null) {
      return next(); // team = unlimited
    }

    const currentCount = await Integration.countDocuments({ userId });
    if (currentCount >= limit) {
      return res.status(403).json({
        error: `Integration limit reached. Your ${user.plan} plan allows up to ${limit} integrations.`,
      });
    }

    return next();
  } catch (err: any) {
    console.error("Integration limit check failed:", err.message);
    return res.status(500).json({ error: "Server error checking integration limits" });
  }
};
