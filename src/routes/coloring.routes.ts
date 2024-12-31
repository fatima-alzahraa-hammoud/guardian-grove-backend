import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { imageUploadMiddleware } from "../middlewares/imageUploadMiddleware";
import { createColoring, deleteColoring, getColoringById, getColorings } from "../controllers/coloring.controller";

const router =  express.Router();

router.post("/", authMiddleware, imageUploadMiddleware, createColoring);
router.get("/", authMiddleware, getColorings);
router.get("/coloring", authMiddleware, getColoringById);
router.delete("/", authMiddleware, deleteColoring);

export default router;