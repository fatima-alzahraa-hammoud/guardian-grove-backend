import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createDrawing, getDrawingById, getDrawings } from "../controllers/drawing.controller";
import { drawingUploadMiddleware } from "../middlewares/drawingUploadMiddleware";

const router =  express.Router();

router.post("/", authMiddleware, drawingUploadMiddleware, createDrawing);
router.get("/", authMiddleware, getDrawings);
router.get("/drawing", authMiddleware, getDrawingById);

export default router;