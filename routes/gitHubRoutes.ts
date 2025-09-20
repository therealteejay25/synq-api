import { Router } from "express";
import {
  redirectToGitHub,
  githubCallback,
} from "../controllers/githubController.ts";
import { requireAuth } from "../middleware/requireAuth.ts";

const router = Router();

router.get("/connect", requireAuth, redirectToGitHub);

router.get("/callback", requireAuth, githubCallback);

export default router;