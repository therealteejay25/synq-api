import { Request, Response } from "express";
import axios from "axios";
import GitHub from "../../models/Github.ts";

export const followUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const github = await GitHub.findOne({ userId: userId.toString() });

    if (!userId) {
      return res
        .status(400)
        .json({ message: "User hasn't been authenticated." });
    }
    if (!github) {
      return res
        .status(400)
        .json({
          message: "No github account has been linked to this account.",
        });
    }
    if (github.expiresAt && github.expiresAt < new Date()) {
      return res
        .status(401)
        .json({
          message:
            "Github access token has expired. Please reconnect your account.",
        });
    }

    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ message: "Username Required" });
    }

    await axios.put(
      `https://api.github.com/user/following/${username}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${github.accessToken}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    res.status(200).json({ message: `You are now following ${username}` });
  } catch (error: any) {
    res
      .status(error.response?.status || 500)
      .json({ error: error.response?.data || error.message });
  }
};

export const unfollowUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const github = await GitHub.findOne({ userId: userId.toString() });

    if (!userId) {
      return res
        .status(400)
        .json({ message: "User hasn't been authenticated." });
    }
    if (!github) {
      return res
        .status(400)
        .json({
          message: "No github account has been linked to this account.",
        });
    }
    if (github.expiresAt && github.expiresAt < new Date()) {
      return res
        .status(401)
        .json({
          message:
            "Github access tokne has expired. Please reconnect your account.",
        });
    }

    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ message: "Username Required" });
    }

    await axios.delete(`https://api.github.com/user/following/${username}`, {
      headers: {
        Authorization: `Bearer ${github.accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    res.status(200).json({ message: `You have unfollowed ${username}` });
  } catch (error: any) {
    res
      .status(error.response?.status || 500)
      .json({ error: error.response?.data || error.message });
  }
};

export const getFollowers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const github = await GitHub.findOne({ userId: userId.toString() });

    if (!userId) {
      return res
        .status(400)
        .json({ message: "User hasn't been authenticated." });
    }
    if (!github) {
      return res
        .status(400)
        .json({
          message: "No github account has been linked to this account.",
        });
    }
    if (github.expiresAt && github.expiresAt < new Date()) {
      return res
        .status(401)
        .json({
          message:
            "Github access tokne has expired. Please reconnect your account.",
        });
    }

    
    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ message: "Username Required" });
    }

    const response = await axios.get(
        `https://api.github.com/users/${username}/followers`,
        {
            headers: {
                Authorization: `Bearer ${github.accessToken}`,
                Accept: "application/vnd.github+json"
            },
        }
    );

    const result = await response.data;

    res.status(200).json({ followers: result })

  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
  }
};

export const getfollowing = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
    const github = await GitHub.findOne({ userId: userId.toString() });

    if (!userId) {
      return res
        .status(400)
        .json({ message: "User hasn't been authenticated." });
    }
    if (!github) {
      return res
        .status(400)
        .json({
          message: "No github account has been linked to this account.",
        });
    }
    if (github.expiresAt && github.expiresAt < new Date()) {
      return res
        .status(401)
        .json({
          message:
            "Github access tokne has expired. Please reconnect your account.",
        });
    }

    
    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ message: "Username Required" });
    }

    const response = await axios.get(
        `https://api.github.com/users/${username}/following`,
        {
            headers: {
                Authorization: `Bearer ${github.accessToken}`,
                Accept: 'application/vnd.github+json'
            },
        }
    );

    const result = await response.data;

    res.status(200).json({ following: result })
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};
