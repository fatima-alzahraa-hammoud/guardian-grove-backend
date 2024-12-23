import express from "express";
import {getUsers, getUserById, createUser} from "../controllers/users.controller";

const router =  express.Router();

router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);

export default router;