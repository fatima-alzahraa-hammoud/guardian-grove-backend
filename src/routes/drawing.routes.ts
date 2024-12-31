import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createDrawing, getDrawings } from "../controllers/drawing.controller";
import { drawingUploadMiddleware } from "../middlewares/drawingUploadMiddleware";

const router =  express.Router();

router.post("/", authMiddleware, drawingUploadMiddleware, createDrawing);
router.get("/", authMiddleware, getDrawings);

export default router;