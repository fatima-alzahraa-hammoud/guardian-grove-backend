import express from "express";
import {getUsers, getUserById, createUser, getUserStars, updateUserStars, getUserCoins} from "../controllers/users.controller";

const router =  express.Router();

router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);

// routes for user's stars
router.get("/:id/stars", getUserStars);
router.put("/:id/stars", updateUserStars);

// routes for user's coins
router.get("/:id/coins", getUserCoins);

export default router;