import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { imageUploadMiddleware } from "../middlewares/imageUploadMiddleware";
import { createColoring } from "../controllers/coloring.controller";

const router =  express.Router();

router.post("/", authMiddleware, imageUploadMiddleware, createColoring);

export default router;