import express from "express";
import { forgetPassword, login, register } from "../controllers/auth.controller";
import { imageUploadMiddleware } from "../middlewares/imageUploadMiddleware";

const router =  express.Router();

router.post("/login", login);
router.post("/register", imageUploadMiddleware, register);
router.post("/forget-password", forgetPassword); 

export default router;