import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { buyItem, createItem, deleteItem, getStoreItems, updateItem } from "../controllers/store.controller";

const router =  express.Router();

router.get("/", authMiddleware, getStoreItems);
router.post("/", authMiddleware, createItem);
router.delete("/", authMiddleware, deleteItem);
router.put("/", authMiddleware, updateItem);
router.post("/buy", authMiddleware, buyItem);



export default router;