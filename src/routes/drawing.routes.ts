import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createDrawing } from "../controllers/drawing.controller";
import { drawingUploadMiddleware } from "../middlewares/drawingUploadMiddleware";

const router =  express.Router();

router.post("/", authMiddleware, drawingUploadMiddleware, createDrawing);

export default router;