import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createItem, deleteItem, getStoreItems } from "../controllers/store.controller";

const router =  express.Router();

router.get("/", authMiddleware, getStoreItems);
router.post("/", authMiddleware, createItem);
router.delete("/", authMiddleware, deleteItem);


export default router;