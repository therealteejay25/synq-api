import User from "../models/User.ts";
import crypto from "crypto";
import { Request, Response } from "express";
import { sendMagicLink } from "../utils/sendMagicLink.ts";
import { generateTokens, verifyRefreshToken } from "../utils/jwt.ts";

interface MagicLinkRequest {
  name?: string;
  email: string;
}

// STEP 1: Request magic link
export const requestMagicLink = async (
  req: Request<{}, {}, MagicLinkRequest>,
  res: Response
) => {
  try {
    const { name, email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    let user = await User.findOne({ email });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const token = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    if (!user) {
      user = await User.create({
        email,
        name: name || "",
        magicLinkToken: token,
        magicLinkExpires: expires,
        magicLinkUsed: false,
      });
    } else {
      user.magicLinkToken = token;
      user.magicLinkExpires = expires;
      user.magicLinkUsed = false;
      await user.save();
    }

    const magicLinkUrl = `http://localhost:3000/auth/verify?token=${rawToken}`;

    await sendMagicLink(user.email, magicLinkUrl); // send full URL

    return res.status(200).json({ message: "Magic link sent!", rawToken });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// STEP 2: Verify magic link
export const verifyMagicLink = async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    if (!token) return res.status(400).json({ error: "Token is required" });

    const hashed = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      magicLinkToken: hashed,
      magicLinkExpires: { $gt: new Date() },
      magicLinkUsed: false,
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // reset magic link fields
    user.magicLinkToken = "";
    user.magicLinkExpires = null;
    user.magicLinkUsed = true;
    user.lastLogin = new Date();
    await user.save();

    // generate your JWTs
    const { accessToken, refreshToken } = generateTokens(user._id!.toString());

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    return res.status(200).json({
      message: "User verified successfully",
      user,
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// STEP 3: Refresh token
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: "No refresh token" });

    const decoded = verifyRefreshToken(token) as { userId: string };
    if (!decoded?.userId) return res.status(401).json({ error: "Invalid refresh token" });

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { accessToken, refreshToken } = generateTokens(user._id!.toString());

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.json({ accessToken, refreshToken });
  } catch {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
};

// STEP 4: Logout
export const logout = (req: Request, res: Response) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  return res.status(200).json({ message: "Logged out successfully" });
};
