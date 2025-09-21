import { Router } from "express";
import {
  redirectToGitHub,
  githubCallback,
  getRepos,
  getUserProfile,
} from "../controllers/githubController.ts";
import { requireAuth } from "../middleware/requireAuth.ts";

const router = Router();

router.get("/connect", requireAuth, redirectToGitHub);

router.get("/callback", requireAuth, githubCallback);

router.get("/repos", requireAuth, getRepos);

router.get("/profile", requireAuth, getUserProfile);

export default router;