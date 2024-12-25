import express from "express";
import { 
  getUsers, getUserById, createUser, getUserStars, 
  updateUserStars, getUserCoins, updateUserCoins, 
  getLocation, updateLocation, getUserRank, updateUserRank
} from "../controllers/users.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";
import { parentsMiddleware } from "../middlewares/parentsMiddleware";

const router = express.Router();

router.get("/", authMiddleware, adminMiddleware, getUsers); 
router.get("/user/:id", authMiddleware, getUserById); 
router.post("/", authMiddleware, parentsMiddleware, createUser); 

// Routes for managing user's stars
router.get("/stars", authMiddleware, getUserStars); 
router.put("/:id/stars", authMiddleware, updateUserStars); 

// Routes for managing user's coins
router.get("/:id/coins", authMiddleware, getUserCoins); 
router.put("/:id/coins", authMiddleware, updateUserCoins); 

// Routes for managing user's location
router.get("/:id/location", authMiddleware, getLocation); 
router.put("/:id/location", authMiddleware, updateLocation); 

// Routes for managing user's rank 
router.get("/:id/rank", getUserRank); 
router.put("/:id/rank", authMiddleware, updateUserRank); 

export default router;