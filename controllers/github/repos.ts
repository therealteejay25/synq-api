import { Request, response, Response } from "express";
import axios from "axios";
import GitHub from "../../models/Github.ts";
import User from "../../models/User.ts";

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

export const createRepo = async (req: Request, res: Response) => {
  try {
    const user = await User.findById((req as any).userId);
    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }
    const github = await GitHub.findOne({ userId: user._id });
    if (!github) {
      return res.status(400).json({ message: "No GitHub account connected to this user." });
    }

    const { name, description, isPrivate } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Repository name is required" });
    }

    const response = axios.post(
      "https://api.github.com/user/repos",
      {
        name,
        description: description || "",
        private : isPrivate || false,
      },
      {
        headers: {
          Authorization: `token ${github.accessToken}`,
          Accept: "application/vnd.github+json"
        }
      }
    );

    const result = await response;
    res.status(201).json({ message: "Repo Created successfully", repo: result.data });
  } catch (error: any) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
};

export const updateRepo = async (req: Request, res: Response) => {
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

    const { owner, repo } = req.params;
    const { name, description, isPrivate } = req.body;

    const response = await axios.patch(
      `https://api.github.com/repos/${owner}/${repo}`,
      { name, description, private: isPrivate },
      {
        headers: {
          Authorization: `Bearer ${github.accessToken}`,
          Accept: "application/vnd.github+json"
        },
      }
    );

    const result = await response.data;

    res.status(200).json({ message: "Repo successfully updated.", repo: result });
    } catch (error: any) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
};

export const deleteRepo = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const github = await GitHub.findOne({ userId: userId.toString() });

    if (!userId)
      return res.status(400).json({ message: "User not authenticated." });
    if (!github)
      return res.status(400).json({ message: "No GitHub account linked." });
    if (github.expiresAt && github.expiresAt < new Date())
      return res.status(401).json({
        message: "GitHub token expired. Reconnect your account.",
      });

    const { owner, repo } = req.params;

    // ✅ Step 1: Fetch current GitHub username dynamically
    const { data: ghUser } = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${github.accessToken}` },
    });
    const tokenOwner = ghUser.login;

    // ✅ Step 2: Ownership check
    if (owner.toLowerCase() !== tokenOwner.toLowerCase()) {
      return res.status(403).json({
        message:
          "You can only delete repos owned by the authenticated GitHub account.",
      });
    }

    // ✅ Step 3: Delete repo
    await axios.delete(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${github.accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    return res.status(200).json({ message: "Repo deleted successfully." });
  } catch (error: any) {
    return res
      .status(error.response?.status || 500)
      .json({ error: error.message });
  }
};


export const starRepo = async (req: Request, res: Response) => {
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
  
      const { owner, repo } = req.params;

      await axios.put(
        `https://api.github.com/user/starred/${owner}/${repo}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${github.accessToken}`,
            Accept: "application/vnd.github+json"
          },
        }
      );

      res.status(200).json({ message: "Repo successfully starred." })
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
};

export const unstarRepo = async (req: Request, res: Response) => {
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
  
      const { owner, repo } = req.params;

      await axios.delete(
        `https://api.github.com/user/starred/${owner}/${repo}`,
        {
          headers: {
            Authorization: `Bearer ${github.accessToken}`,
            Accept: "application/vnd.github+json",
          },
        }
      );

      res.status(200).json({ message: "Succesfully Unstarred Repo." })
    } catch (error: any) {
      res.status(error.response?.status || 500).json({ error: error.message });
    };
};

export const getBranches = async (req: Request, res: Response) => {
    try{
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
  
      const { owner, repo } = req.params;

      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/branches`,
        {
          headers: {
            Authorization: `Bearer ${github.accessToken}`,
            Accept: "application/vnd.github+json"
          },
        }
      );
      const result = await response.data;

      res.status(200).json({ message: "Branches fetched successfully", branches: result });
    } catch (error: any) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
};

export const getTopics = async (req: Request, res: Response) => {
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
  
      const { owner, repo } = req.params;

      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/topics`,
        {
          headers: {
            Authorization: `Bearer ${github.accessToken}`,
            Accept: "application/vnd.github+json"
          },
        }
      );

      const result = await response.data;

      res.status(200).json({ message: "Topics fetched succesfully", topics: result });
  } catch (error: any) {
     res.status(error.response?.status || 500).json({ error: error.message });
  }
};

export const getIssues = async (req: Request, res: Response) => {
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
  
      const { owner, repo } = req.params;

      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/issues`,
        {
          headers: {
            Authorization: `Bearer ${github.accessToken}`,
            Accept: 'application/vnd.github+json'
          },
        }
      );

      const result = response.data;

      res.status(200).json({ message: "Successfully fetched issues.", issue: result })
      } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.message });
      }
};

export const createIssue = async (req: Request, res: Response) => {
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
  
      const { owner, repo } = req.params;
      const { title, body } = req.body;
      
      const response = await axios.post(
        `https://api.github.com/repos/${owner}/${repo}/issues`,
        { title, body },
        {
          headers: {
            Authorization: `Bearer ${github.accessToken}`,
            Accept: "application/vnd.github+json"
          },
        }
      );

      const result = await response.data;

      res.status(200).json({ message: "Successfully created an issue.", issue: result });
    } catch(error: any) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
};

export const closeIssue = async (req:Request, res: Response) => {
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
  
      const { owner, repo, number } = req.params;

      const response = await axios.patch(
        `https://api.github.com/repos/${owner}/${repo}/issues/${number}`,
        { state: "closed" },
        {
          headers: {
            Authorization: `Bearer ${github.accessToken}`,
            Accept: "application/vnd.github+json"
          }
        }
      );

      const result = response.data;

      res.status(200).json({ message: "Issues closed successfully", issues: result })
      } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.message });
      }
};

export const getComments = async (req: Request, res: Response) => {
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
  
      const { owner, repo, number } = req.params;

      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/issues/${number}/comments`,
        {
          headers: {
            Authorization: `Bearer ${github.accessToken}`,
            Accept: "application/vnd.github+json"
          },
        }
      );

      const result = response.data;

      res.status(200).json({ message: "Successfuly fetched all comments.", comments: result })
    } catch (error: any) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
};

export const addComment = async (req: Request, res: Response) => {
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
  
      const { owner, repo, number } = req.params;
      const { body } = req.body;

      const response = await axios.post(
        `https://api.github.com/repos/${owner}/${repo}/issues/${number}/comments`,
        { body },
        {
          headers: {
            Authorization: `Bearer ${github.accessToken}`,
            Accept: "application/vnd.github+json"
          },
        }
      );

      const result = await response.data;

      res.status(200).json({ message: "Comment successfully added.", comment: result })
    } catch (error: any) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
};

export const getPRs = async (req: Request, res: Response) => {
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
  
      const { owner, repo } = req.params;

      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/pulls`,
        {
          headers: {
            Authorization: `Bearer ${github.accessToken}`,
            Accept: "application/vnd.github+json",
          }
        }
      );

      const result = response.data;

      res.status(200).json({ message: "Successfully fetched all pull requests.", prs: result });
    } catch (error: any) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
};

export const createPR = async (req: Request, res: Response) => {
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
  
      const { owner, repo } = req.params;
      const { title, head, base, body } = req.body;

      const response = await axios.post(
        `https://api.github.com/repos/${owner}/${repo}/pulls`,
        { title, head, base, body },
        { headers: {
           Authorization: `token ${github.accessToken}`,
           Accept: "application/vnd.github+json"
          } }
      );

      const result = response.data;

      res.status(200).json({ message: "Successfully fetched all pull requests.", prs: result });
    } catch (error: any) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
};
export const mergePRs = async (req: Request, res: Response) => {
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
  
      const { owner, repo, number } = req.params;

      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/pulls`,
        {
          headers: {
            Authorization: `Bearer ${github.accessToken}`,
            Accept: "application/vnd.github+json",
          }
        }
      );

      const result = response.data;

      res.status(200).json({ message: "Successfully fetched all pull requests.", prs: result });
    } catch (error: any) {
      res.status(error.response?.status || 500).json({ error: error.message });
    }
};

