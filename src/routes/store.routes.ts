import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getStoreItems } from "../controllers/store.controller";

const router =  express.Router();

router.get("/", authMiddleware, getStoreItems);

export default router;