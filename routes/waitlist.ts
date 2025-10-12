import { Router } from "express";
import { addToWaitlist, getWaitlist } from "../controllers/waitlist/controller.ts";

const router = Router();

router.get('/', getWaitlist);
router.post('/add', addToWaitlist);


export default router;