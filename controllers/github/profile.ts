import { Request, Response } from "express";
import axios from "axios";
import GitHub from "../../models/Integration.ts";

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId; // from requireAuth middleware
    
    // Find the user's GitHub integration
    const githubIntegration = await GitHub.findOne({ userId: userId.toString() });
    
    if (!githubIntegration) {
      return res.status(404).json({ error: "GitHub integration not found. Please connect your GitHub account first." });
    }

    // Check if the access token is expired
    if (githubIntegration.expiresAt && githubIntegration.expiresAt < new Date()) {
      return res.status(401).json({ error: "GitHub access token has expired. Please reconnect your GitHub account." });
    }

    // Fetch user profile from GitHub API
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${githubIntegration.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Synq'
      }
    });

    const userProfile = response.data;

    // Transform the response to include all relevant user details
    const profile = {
      id: userProfile.id,
      login: userProfile.login,
      nodeId: userProfile.node_id,
      avatarUrl: userProfile.avatar_url,
      gravatarId: userProfile.gravatar_id,
      url: userProfile.url,
      htmlUrl: userProfile.html_url,
      followersUrl: userProfile.followers_url,
      followingUrl: userProfile.following_url,
      gistsUrl: userProfile.gists_url,
      starredUrl: userProfile.starred_url,
      subscriptionsUrl: userProfile.subscriptions_url,
      organizationsUrl: userProfile.organizations_url,
      reposUrl: userProfile.repos_url,
      eventsUrl: userProfile.events_url,
      receivedEventsUrl: userProfile.received_events_url,
      type: userProfile.type,
      siteAdmin: userProfile.site_admin,
      name: userProfile.name,
      company: userProfile.company,
      blog: userProfile.blog,
      location: userProfile.location,
      email: userProfile.email,
      hireable: userProfile.hireable,
      bio: userProfile.bio,
      twitterUsername: userProfile.twitter_username,
      publicRepos: userProfile.public_repos,
      publicGists: userProfile.public_gists,
      followers: userProfile.followers,
      following: userProfile.following,
      createdAt: userProfile.created_at,
      updatedAt: userProfile.updated_at,
      privateGists: userProfile.private_gists,
      totalPrivateRepos: userProfile.total_private_repos,
      ownedPrivateRepos: userProfile.owned_private_repos,
      diskUsage: userProfile.disk_usage,
      collaborators: userProfile.collaborators,
      twoFactorAuthentication: userProfile.two_factor_authentication,
      plan: userProfile.plan ? {
        name: userProfile.plan.name,
        space: userProfile.plan.space,
        privateRepos: userProfile.plan.private_repos,
        collaborators: userProfile.plan.collaborators,
        filledSeats: userProfile.plan.filled_seats,
        seats: userProfile.plan.seats
      } : null
    };

    return res.json({
      message: "User profile fetched successfully",
      profile: profile
    });

  } catch (error: any) {
    console.error("GitHub user profile fetch error:", error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ error: "GitHub access token is invalid. Please reconnect your GitHub account." });
    }
    
    if (error.response?.status === 403) {
      return res.status(403).json({ error: "GitHub API rate limit exceeded or insufficient permissions." });
    }
    
    return res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    if (!userId) {
      return res.status(400).json({ message: "User not authenticated!" })
    }
    const github = await GitHub.findOne({ userId: userId.toString() });
    
    if (!github) {
      return res.status(404).json({ error: "GitHub integration not found. Please connect your GitHub account first." });
    }

    // Check if the access token is expired
    if (github.expiresAt && github.expiresAt < new Date()) {
      return res.status(401).json({ error: "GitHub access token has expired. Please reconnect your GitHub account." });
    }

    const {name, bio, location, website, company} = req.body;
    const response = await axios.patch(
      "https://api.github.com/user",
      { name, bio, location, blog: website, company },
      {
        headers: {
          Authorization: `Bearer ${github.accessToken}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );

    const result = await response.data

    res.status(200).json({ message: "GitHub profile updated", profile: result })
    
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
  }
};

