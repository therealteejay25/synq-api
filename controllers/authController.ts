import User from "../models/User.ts";
import crypto from "crypto";
import { Request, Response } from "express";
import { sendMagicLink } from "../utils/sendMagicLink.ts";
import { generateTokens, verifyRefreshToken } from "../utils/jwt.ts";

interface MagicLinkRequest {
  name?: string;
  email: string;
}

// 🔒 Cookie options (auto toggle for prod)
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // true on HTTPS
  sameSite: "none" as const, // allow cross-site requests
  path: "/",
};

// 🛠 Helper for consistent error handling
const handleError = (res: Response, error: any, context: string) => {
  console.error(`❌ [${context}]`, {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: (error as any).code,
  });
  return res.status(500).json({
    error: `Server error in ${context}`,
    details: error.message,
  });
};

// STEP 1: Request magic link
export const requestMagicLink = async (
  req: Request<{}, {}, MagicLinkRequest>,
  res: Response
) => {
  try {
    const { name, email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    let user;
    try {
      user = await User.findOne({ email });
    } catch (err: any) {
      throw new Error("DB lookup failed: " + err.message);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const token = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    if (!user) {
      user = new User({
        email,
        name: name || "",
      });
    }

    user.magicLinkToken = token;
    user.magicLinkExpires = expires;
    user.magicLinkUsed = false;

    try {
      await user.save();
    } catch (err: any) {
      throw new Error("User save failed: " + err.message);
    }

    console.log("📧 Sending magic link to:", user.email, "RawToken:", rawToken);

    try {
      await sendMagicLink(user.email, rawToken);
    } catch (err: any) {
      throw new Error("Email send failed: " + err.message);
    }

    return res.status(200).json({ message: "Magic link sent!" });
  } catch (error: any) {
    return handleError(res, error, "requestMagicLink");
  }
};

// STEP 2: Verify magic link
export const verifyMagicLink = async (req: Request, res: Response) => {
  try {
    console.log("🔍 Magic link verification called");
    console.log("Query params:", req.query);

    const token = req.query.token as string;
    if (!token) return res.status(400).json({ error: "Token is required" });

    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    console.log("Looking for hashed token:", hashed);

    let user;
    try {
      user = await User.findOne({
        magicLinkToken: hashed,
        magicLinkExpires: { $gt: new Date() },
        magicLinkUsed: false,
      });
    } catch (err: any) {
      throw new Error("DB lookup failed: " + err.message);
    }

    if (!user) {
      console.log("❌ No user found with valid token");
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    console.log("✅ User found:", user.email);

    // Reset magic link fields
    user.magicLinkToken = "";
    user.magicLinkExpires = null;
    user.magicLinkUsed = true;
    user.lastLogin = new Date();

    try {
      await user.save();
    } catch (err: any) {
      throw new Error("User save failed: " + err.message);
    }

    // Generate JWTs
    const { accessToken, refreshToken } = generateTokens(user._id!.toString());
    console.log("🔑 Generated tokens:", {
      accessToken: accessToken.substring(0, 20) + "...",
      refreshToken: refreshToken.substring(0, 20) + "...",
    });

    // Set cookies
    console.log("🍪 Setting cookies with options:", COOKIE_OPTIONS);
    res.cookie("accessToken", accessToken, COOKIE_OPTIONS);
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    console.log("✅ Cookies set successfully");

    return res.status(200).json({
      message: "User verified successfully",
      user,
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    return handleError(res, error, "verifyMagicLink");
  }
};

// STEP 3: Refresh token
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: "No refresh token" });

    let decoded;
    try {
      decoded = verifyRefreshToken(token) as { userId: string };
    } catch (err: any) {
      throw new Error("Refresh token verify failed: " + err.message);
    }

    if (!decoded?.userId)
      return res.status(401).json({ error: "Invalid refresh token" });

    const user = await User.findById(decoded.userId).catch((err: any) => {
      throw new Error("User lookup failed: " + err.message);
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const { accessToken, refreshToken } = generateTokens(user._id!.toString());

    res.cookie("accessToken", accessToken, COOKIE_OPTIONS);
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    return res.json({ message: "Token refreshed" });
  } catch (error: any) {
    return handleError(res, error, "refreshAccessToken");
  }
};

// STEP 4: Logout
export const logout = (req: Request, res: Response) => {
  try {
    res.clearCookie("accessToken", COOKIE_OPTIONS);
    res.clearCookie("refreshToken", COOKIE_OPTIONS);
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error: any) {
    return handleError(res, error, "logout");
  }
};
