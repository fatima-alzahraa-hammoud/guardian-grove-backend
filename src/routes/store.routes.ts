import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { buyItem, createItem, deleteItem, getStoreItems, updateItem } from "../controllers/store.controller";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router =  express.Router();

router.get("/", authMiddleware, getStoreItems);
router.post("/", authMiddleware, createItem);
router.delete("/:itemId", authMiddleware, adminMiddleware, deleteItem);
router.put("/", authMiddleware, updateItem);
router.post("/buy", authMiddleware, buyItem);



export default router;