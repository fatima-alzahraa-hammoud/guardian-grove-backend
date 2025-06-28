import express from "express";
import { forgetPassword, login, register } from "../controllers/auth.controller";

const router =  express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/forget-password", forgetPassword); 

export default router;