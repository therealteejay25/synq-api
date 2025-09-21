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
      if (refresh_token) {
        github.refreshToken = refresh_token;
      }
      github.expiresAt = expiresAt;
      await github.save();
      return res.json({ message: "GitHub integration updated", toolId: github._id });
    }
    

    // Step 3: Create new GitHub integration
    const githubData: any = {
      userId: userId.toString(),
      accessToken: access_token,
      expiresAt,
    };
    
    // Only add refreshToken if it exists
    if (refresh_token) {
      githubData.refreshToken = refresh_token;
    }
    
    github = await GitHub.create(githubData);

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

export const getRepos = async (req: Request, res: Response) => {
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

    // Fetch repositories from GitHub API
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: {
        'Authorization': `Bearer ${githubIntegration.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Synq'
      },
      params: {
        sort: 'updated',
        per_page: 100, // Get up to 100 repos
        type: 'all' // Include both public and private repos
      }
    });

    const repos = response.data.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      htmlUrl: repo.html_url,
      cloneUrl: repo.clone_url,
      sshUrl: repo.ssh_url,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
      defaultBranch: repo.default_branch,
      owner: {
        login: repo.owner.login,
        avatarUrl: repo.owner.avatar_url,
        htmlUrl: repo.owner.html_url
      }
    }));

    return res.json({
      message: "Repositories fetched successfully",
      count: repos.length,
      repositories: repos
    });

  } catch (error: any) {
    console.error("GitHub repos fetch error:", error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ error: "GitHub access token is invalid. Please reconnect your GitHub account." });
    }
    
    if (error.response?.status === 403) {
      return res.status(403).json({ error: "GitHub API rate limit exceeded or insufficient permissions." });
    }
    
    return res.status(500).json({ error: "Failed to fetch repositories" });
  }
};

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