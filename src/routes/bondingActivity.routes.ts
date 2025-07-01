import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { 
    createBondingActivity,} from "../controllers/bondingActivity.controller";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createBondingActivity);

export default router;