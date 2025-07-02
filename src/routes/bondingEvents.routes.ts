import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
    generateBondingEvents,
    reviewBondingEvent,
    getFamilyBondingEvents
} from "../controllers/bondingEvents.controller";

const router = express.Router();

router.use(authMiddleware);

// Generate bonding events using AI
router.post("/generate", generateBondingEvents);

// Approve or reject a bonding event
router.post("/review", reviewBondingEvent);

// Get all bonding events for a family
router.get("/", getFamilyBondingEvents);

export default router;