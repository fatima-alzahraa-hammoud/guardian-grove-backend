import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createStory, getStories } from "../controllers/story.controller";

const router =  express.Router();

router.post("/", authMiddleware, createStory);
router.get("/", authMiddleware, getStories);

export default router;