import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { generateTokens, verifyRefreshToken } from "../utils/jwt.ts";
import User from "../models/User.ts";

const ACCESS_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_SECRET!;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false, // true on prod (https)
  sameSite: "lax" as const, 
  path: "/",
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Debug: Log all cookies received
    console.log("All cookies:", req.cookies);
    console.log("Access token cookie:", req.cookies.accessToken);
    
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (!accessToken) {
      console.log("No access token found in cookies");
      return res.status(401).json({ error: "No token provided" });
    }

    try {
      // Try to verify the access token
      const decoded = jwt.verify(accessToken, ACCESS_SECRET) as { userId: string };
      (req as any).userId = decoded.userId;
      next();
    } catch (accessTokenError: any) {
      console.log("Access token error:", accessTokenError.name);
      
      // If access token is expired and we have a refresh token, try to refresh
      if (accessTokenError.name === 'TokenExpiredError' && refreshToken) {
        console.log("Access token expired, attempting refresh...");
        
        try {
          const refreshDecoded = verifyRefreshToken(refreshToken) as { userId: string };
          const user = await User.findById(refreshDecoded.userId);
          
          if (!user) {
            console.log("User not found for refresh token");
            return res.status(401).json({ error: "Invalid refresh token" });
          }

          // Generate new tokens
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user._id!.toString());
          
          // Set new cookies
          res.cookie("accessToken", newAccessToken, COOKIE_OPTIONS);
          res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);
          
          console.log("✅ Tokens refreshed successfully");
          (req as any).userId = user._id!.toString();
          next();
          
        } catch (refreshError) {
          console.log("Refresh token error:", refreshError);
          return res.status(401).json({ error: "Session expired. Please log in again." });
        }
      } else {
        // Access token is invalid for other reasons, or no refresh token
        console.log("Access token invalid and no valid refresh token");
        return res.status(401).json({ error: "Invalid or expired token" });
      }
    }
  } catch (error) {
    console.log("Unexpected error in requireAuth:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
};
