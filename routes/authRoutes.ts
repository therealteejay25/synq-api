import { Router } from "express";
import { logout, refreshAccessToken, requestMagicLink, verifyMagicLink } from "../controllers/authController.ts";

const router = Router();

router.post('/request-link', requestMagicLink);
router.get('/verify-token', verifyMagicLink);
router.post('/refresh-token', refreshAccessToken)
router.post("/logout", logout);


export default router;