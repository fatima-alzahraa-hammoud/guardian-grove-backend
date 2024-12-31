import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { imageUploadMiddleware } from "../middlewares/imageUploadMiddleware";
import { createColoring, getColorings } from "../controllers/coloring.controller";

const router =  express.Router();

router.post("/", authMiddleware, imageUploadMiddleware, createColoring);
router.get("/", authMiddleware, getColorings);

export default router;