import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createDrawing, deleteDrawing, getDrawingById, getDrawings, updateDrawing } from "../controllers/drawing.controller";
import {imageUploadMiddleware } from "../middlewares/imageUploadMiddleware";

const router =  express.Router();

router.post("/", authMiddleware, imageUploadMiddleware, createDrawing);
router.get("/", authMiddleware, getDrawings);
router.get("/drawing", authMiddleware, getDrawingById);
router.delete("/", authMiddleware, deleteDrawing);
router.put("/:userId/:drawingId", authMiddleware, imageUploadMiddleware, updateDrawing);

export default router;