import { Request, Response } from "express";
import axios from "axios";
import GitHub from "../models/Github.ts";
import User from "../models/User.ts";


export const redirectToGitHub = (req: Request, res: Response) => {
    const clientId = process.env.GITHUB_CLIENT_ID!;
    const redirectUri = process.env.GITHUB_REDIRECT_URI!;

    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo,user,admin:repo_hook`;

    res.redirect(url);
}

export const githubCallback = async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    const userId = (req as any).userId; // from your auth middleware

    if (!code) return res.status(400).json({ error: "No code provided" });

    // Step 1: Exchange code for access token
    const tokenRes = await axios.post(
      `https://github.com/login/oauth/access_token`,
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_REDIRECT_URI,
      },
      { headers: { Accept: "application/json" } }
    );

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    if (!access_token) return res.status(400).json({ error: "No access token returned" });

    const expiresAt = new Date(Date.now() + (expires_in ? expires_in * 1000 : 3600 * 1000));

    // Step 2: Check if GitHub integration already exists for this user
    let github = await GitHub.findOne({ userId: userId.toString() });
    if (github) {
      github.accessToken = access_token;
      github.refreshToken = refresh_token || github.refreshToken;
      github.expiresAt = expiresAt;
      await github.save();
      return res.json({ message: "GitHub integration updated", toolId: github._id });
    }
    

    // Step 3: Create new GitHub integration
    github = await GitHub.create({
      userId: userId.toString(),
      orgId: null, // optional
      accessToken: access_token,
      refreshToken: refresh_token || "", // GitHub doesn't always return refresh token
      expiresAt,
    });

    // Step 4: Add GitHub tool to user's ownedTools
    await User.findByIdAndUpdate(userId, { $addToSet: { ownedTools: github._id } });

    return res.json({
      message: "GitHub integration successfully created",
      toolId: github._id,
    });
  } catch (err: any) {
    console.error("GitHub callback error:", err.response?.data || err.message);
    return res.status(500).json({ error: "GitHub integration failed" });
  }
};