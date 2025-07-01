import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createBondingActivity, getBondingActivities, updateBondingActivity,} from "../controllers/bondingActivity.controller";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createBondingActivity);
router.get("/", getBondingActivities);
router.put("/:activityId", updateBondingActivity);

export default router;