import express from "express";
import {getUsers, getUserById, createUser, getUserStars} from "../controllers/users.controller";

const router =  express.Router();

router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);

// routes for user's stars
router.get("/:id/stars", getUserStars);

export default router;