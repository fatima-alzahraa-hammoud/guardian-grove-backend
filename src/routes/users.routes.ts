import express from "express";
import { 
  getUsers, getUserById, createUser, getUserStars, 
  updateUserStars, getUserCoins, updateUserCoins, 
  getLocation, updateLocation, getUserRank,
  editUserProfile, deleteUser,
  getUserInterests, updatePassword,
  startAdventure,
  completeChallenge,
  getUserAdventures,
  getUserPurchasedItems,
  getUserAvatar
} from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";
import { checkQuestionCompletion, generateDailyAdventure, generateGrowthPlans, generateLearningZone, generateQuickTips, generateStory, generateTaskCompletionQuestion, generateTrackDay, generateViewTasks, regenerateGoalsAndTasksRoute } from "../controllers/ai.controller";

const router = express.Router();

router.get("/", authMiddleware, adminMiddleware, getUsers); 
router.get("/user", authMiddleware, getUserById); 
router.post("/", authMiddleware, createUser); 
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
//router.put("/rank", authMiddleware, updateUserRank); 

// Routes for user's interests 
router.get("/interests", authMiddleware, getUserInterests); 

// Routes for user's adventures 
router.post("/adventure", authMiddleware, startAdventure); 
router.post("/adventure/challenge", authMiddleware, completeChallenge); 
router.get("/adventures", authMiddleware, getUserAdventures); 


// Routes for user's purchased items 
router.get("/purchasedItems", authMiddleware, getUserPurchasedItems); 

// Routes for user's avatar 
router.get("/user/avatar", authMiddleware, getUserAvatar); 

// routes for generate AI
router.post("/generateGoals", regenerateGoalsAndTasksRoute);
router.post("/generatePlan", generateGrowthPlans);
router.post("/generateLearningZone", generateLearningZone);
router.post("/generateTrackDay", generateTrackDay);
router.post("/generateStory", generateStory);
router.post("/generateViewTasks", generateViewTasks);
router.post("/generateQuickTip", generateQuickTips);
router.post("/generateQusetion", generateTaskCompletionQuestion);
router.post("/checkAnswer", checkQuestionCompletion);
router.post("/generateAdventure", generateDailyAdventure);

export default router;