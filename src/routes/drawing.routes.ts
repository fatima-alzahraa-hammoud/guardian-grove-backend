import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createDrawing, deleteDrawing, getDrawingById, getDrawings, updateDrawing } from "../controllers/drawing.controller";
import { drawingUploadMiddleware } from "../middlewares/drawingUploadMiddleware";

const router =  express.Router();

router.post("/", authMiddleware, drawingUploadMiddleware, createDrawing);
router.get("/", authMiddleware, getDrawings);
router.get("/drawing", authMiddleware, getDrawingById);
router.delete("/", authMiddleware, deleteDrawing);
router.put("/:userId/:drawingId", authMiddleware, drawingUploadMiddleware, updateDrawing);

export default router;