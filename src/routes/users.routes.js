import { Router } from "express";
import {getUsers, getUserById} from "../controllers/users.controller.ts";

const router = new Router();

router.get("/", getUsers);

export default router;