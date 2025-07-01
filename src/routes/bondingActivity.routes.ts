import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createBondingActivity, deleteBondingActivity, getBondingActivities, updateBondingActivity,} from "../controllers/bondingActivity.controller";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createBondingActivity);
router.get("/", getBondingActivities);
router.put("/:activityId", updateBondingActivity);
router.delete("/:activityId", deleteBondingActivity);

export default router;