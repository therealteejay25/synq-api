import { Request, Response } from "express";
import GitHub from "../models/Github.ts";
import User from "../models/User.ts";

export const connectGitHub = async (req: Request & { user?: any }, res: Response) => {
    try {
        const userId = req.user?._id;
        const { username, bio, avatar, plan, accessToken, refreshToken, scopes } = req.body;
    } catch (error) {
        // Handle error appropriately
    }
}