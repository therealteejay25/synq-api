import { Request, Response } from "express";
import axios from "axios";
import Integration from "../../models/Integration.ts";
import User from "../../models/User.ts";
import { remainingIntegrations } from "../../utils/remianingIntegrations.ts"; // helper we built

export const redirectToGitHub = (req: Request, res: Response) => {
  const clientId = process.env.GITHUB_CLIENT_ID!;
  const redirectUri = process.env.GITHUB_REDIRECT_URI!;

  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo,user,admin:repo_hook,delete_repo`;
  res.redirect(url);
};

export const githubCallback = async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    const userId = (req as any).userId; // set by auth middleware

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

    // Step 2: Fetch GitHub account details
    const userRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { id: githubId, login: username, avatar_url } = userRes.data;

    // Step 3: Check plan limit before creating integration
    const { limit, used } = await remainingIntegrations(userId);
    if (limit !== null && used >= limit) {
      return res.status(403).json({
        error: `Integration limit reached. Your plan allows up to ${limit} integrations.`,
      });
    }

    // Step 4: Decide if it's classic vs expirable
    const isExpirable = Boolean(refresh_token && expires_in);
    let expiresAt: Date | null = null;
    let refreshTokenExpiresAt: Date | null = null;

    if (isExpirable) {
      expiresAt = new Date(Date.now() + expires_in * 1000);
      refreshTokenExpiresAt = new Date(
        Date.now() + refresh_token_expires_in * 1000
      );
    }

    // Step 5: Upsert GitHub integration for this account
    let github = await Integration.findOne({
      userId: userId.toString(),
      provider: "github",
      providerAccountId: githubId.toString(),
    });

    if (github) {
      github.accessToken = access_token;
      github.expiresAt = expiresAt;
      if (refresh_token) {
        github.refreshToken = refresh_token;
      }
      github.username = username;
      github.avatar = avatar_url;
      await github.save();
    } else {
      github = await Integration.create({
        name: "github",
        provider: "github",
        providerAccountId: githubId.toString(),
        userId: userId.toString(),
        accessToken: access_token,
        expiresAt,
        username,
        avatar: avatar_url,
        ...(refresh_token && {
          refreshToken: refresh_token,
          refreshTokenExpiresAt,
        }),
      });

      await User.findByIdAndUpdate(userId, {
        $addToSet: { ownedTools: github._id },
      });
    }

    return res.json({
      message: isExpirable
        ? "GitHub integration created (expiring token with refresh)."
        : "GitHub integration created (classic permanent token).",
      toolId: github._id,
      account: { githubId, username, avatar: avatar_url },
    });
  } catch (err: any) {
    console.error("GitHub callback error:", err.response?.data || err.message);
    return res.status(500).json({ error: "GitHub integration failed" });
  }
};
