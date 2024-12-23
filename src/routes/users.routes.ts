import express from "express";
import {getUsers, getUserById} from "../controllers/users.controller";

const router =  express.Router();

router.get("/", getUsers);

export default router;