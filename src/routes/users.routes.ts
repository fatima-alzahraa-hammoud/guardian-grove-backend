import express from "express";
import { 
  getUsers, getUserById, createUser, getUserStars, 
  updateUserStars, getUserCoins, updateUserCoins, 
  getLocation, updateLocation, getUserRank, updateUserRank,
  editUserProfile, deleteUser,
  getUserInterests, updatePassword
} from "../controllers/users.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";
import { parentsMiddleware } from "../middlewares/parentsMiddleware";

const router = express.Router();

router.get("/", authMiddleware, adminMiddleware, getUsers); 
router.get("/user", authMiddleware, getUserById); 
router.post("/", authMiddleware, parentsMiddleware, createUser); 
router.put("/", authMiddleware, editUserProfile);
router.delete("/", authMiddleware, deleteUser);
router.put("/updatePassword", authMiddleware, updatePassword);

// Routes for managing user's stars
router.get("/stars", authMiddleware, getUserStars); 
router.put("/stars", authMiddleware, updateUserStars); 

// Routes for managing user's coins
router.get("/coins", authMiddleware, getUserCoins); 
router.put("/coins", authMiddleware, updateUserCoins); 

// Routes for managing user's location
router.get("/location", authMiddleware, getLocation); 
router.put("/location", authMiddleware, updateLocation); 

// Routes for managing user's rank 
router.get("/rank", authMiddleware, getUserRank); 
router.put("/rank", authMiddleware, updateUserRank); 

// Routes for user's interests 
router.get("/interests", authMiddleware, getUserInterests); 

export default router;