import { Request, Response } from "express";
import axios from "axios";
import GitHub from "../../models/Github.ts";
import User from "../../models/User.ts";

export const redirectToGitHub = (req: Request, res: Response) => {
  const clientId = process.env.GITHUB_CLIENT_ID!;
  const redirectUri = process.env.GITHUB_REDIRECT_URI!;

  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo,user,admin:repo_hook,delete_repo`;


  res.redirect(url);
};

export const githubCallback = async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    const userId = (req as any).userId; // from your auth middleware

    if (!code) {
      return res.status(400).json({ error: "No code provided" });
    }

    // Step 1: Exchange code for token(s)
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_REDIRECT_URI,
      },
      { headers: { Accept: "application/json" } }
    );

    const {
      access_token,
      refresh_token,
      expires_in,
      refresh_token_expires_in,
    } = tokenRes.data;

    if (!access_token) {
      return res.status(400).json({ error: "No access token returned" });
    }

    // Decide if it's classic vs expirable
    const isExpirable = Boolean(refresh_token && expires_in);

    let expiresAt: Date | null = null;
    let refreshTokenExpiresAt: Date | null = null;

    if (isExpirable) {
      expiresAt = new Date(Date.now() + expires_in * 1000);
      refreshTokenExpiresAt = new Date(Date.now() + refresh_token_expires_in * 1000);
    }

    // Step 2: Upsert GitHub integration
    let github = await GitHub.findOne({ userId: userId.toString() });
    if (github) {
      github.accessToken = access_token;
      github.expiresAt = expiresAt; 
      await github.save();
    } else {
      github = await GitHub.create({
        userId: userId.toString(),
        accessToken: access_token,
        expiresAt,
        ...(refresh_token && { 
          refreshToken: refresh_token,
          refreshTokenExpiresAt 
        }),
      });

      await User.findByIdAndUpdate(userId, { $addToSet: { ownedTools: github._id } });
    }

    return res.json({
      message: isExpirable
        ? "GitHub integration created (expiring token with refresh)."
        : "GitHub integration created (classic permanent token).",
      toolId: github._id,
    });
  } catch (err: any) {
    console.error("GitHub callback error:", err.response?.data || err.message);
    return res.status(500).json({ error: "GitHub integration failed" });
  }
};
