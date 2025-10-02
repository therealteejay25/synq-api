import Integration from "../models/Integration.ts";
import User from "../models/User.ts";

const PLAN_LIMITS: Record<string, number | null> = {
  free: 4,
  pro: 8,
  premium: 10,
  team: null, // unlimited
};

export const remainingIntegrations = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const limit = PLAN_LIMITS[user.plan];
  if (limit === null) {
    return { limit: null, remaining: null, used: 0 }; // unlimited
  }

  const used = await Integration.countDocuments({ userId });
  const remaining = Math.max(0, limit - used);

  return { limit, used, remaining };
};
