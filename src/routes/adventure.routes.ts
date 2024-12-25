import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createAdventure } from "../controllers/adventure.controller";

const router =  express.Router();

router.post("/", createAdventure);

export default router;