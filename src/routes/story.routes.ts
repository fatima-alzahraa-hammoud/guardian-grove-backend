import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createStory, deleteStory, getStories, getStoryById, updateStory } from "../controllers/story.controller";

const router =  express.Router();

router.post("/", authMiddleware, createStory);
router.get("/", authMiddleware, getStories);
router.get("/story/:storyId", authMiddleware, getStoryById);
router.delete("/", authMiddleware, deleteStory);
router.put("/", authMiddleware, updateStory);

export default router;