import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.ts";

// Import from new controller structure
import { redirectToGitHub, githubCallback } from "../controllers/github/auth.ts";
import { getRepos, createRepo, updateRepo, deleteRepo, starRepo, unstarRepo, getBranches, getTopics, getIssues, createIssue, closeIssue, getComments, addComment } from "../controllers/github/repos.ts";
import { getUserProfile, updateUserProfile } from "../controllers/github/profile.ts";
import { followUser, getFollowers, getfollowing, unfollowUser } from "../controllers/github/users.ts";

const router = Router();

// OAuth routes
router.get("/connect", requireAuth, redirectToGitHub);
router.get("/callback", requireAuth, githubCallback);

// Repository routes
router.get("/repos", requireAuth, getRepos);
router.post("/repos", requireAuth, createRepo);
router.patch("/repos/:owner/:repo", requireAuth, updateRepo);
router.delete("/repos/:owner/:repo", requireAuth, deleteRepo);
router.put("/repos/:owner/:repo/star", requireAuth, starRepo);
router.delete("/repos/:owner/:repo/star", requireAuth, unstarRepo);
router.get("/repos/:owner/:repo/branches", requireAuth, getBranches);
router.get("/repos/:owner/:repo/topics", requireAuth, getTopics);
router.get("/repos/:owner/:repo/issues", requireAuth, getIssues)
router.post("/repos/:owner/:repo/issues", requireAuth, createIssue)
router.patch("/repos/:owner/:repo/issues/:number/close", requireAuth, closeIssue)
router.get("/repos/:owner/:repo/issues/:number/comments", requireAuth, getComments)
router.patch("/repos/:owner/:repo/issues/:number/comments", requireAuth, addComment)

// Profile routes
router.get("/profile", requireAuth, getUserProfile);
router.patch("/profile", requireAuth, updateUserProfile);

// Users routes
router.put("/users/follow/:username", requireAuth, followUser)
router.delete("/users/follow/:username", requireAuth, unfollowUser)
router.get ("/users/:username/followers", requireAuth, getFollowers)
router.get ("/users/:username/following", requireAuth, getfollowing)

export default router;