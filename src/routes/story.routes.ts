import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createStory } from "../controllers/story.controller";

const router =  express.Router();

router.post("/", authMiddleware, createStory);

export default router;