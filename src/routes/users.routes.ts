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
  getUserAvatar,
  saveFcmToken,
  // Add the new admin functions
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  createUserByAdmin
} from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";
import { checkQuestionCompletion, generateDailyAdventureRoute, generateGrowthPlans, generateLearningZone, generateQuickTips, generateStory, generateTaskCompletionQuestion, generateTasksForGoal, generateTrackDay, generateViewTasks, regenerateGoalsAndTasksRoute } from "../controllers/ai.controller";
import { imageUploadMiddleware } from "../middlewares/imageUploadMiddleware";

const router = express.Router();

// Admin routes for user management
router.get("/", authMiddleware, adminMiddleware, getAllUsers); // Use the new function
router.get("/all", authMiddleware, adminMiddleware, getAllUsers); // Alternative endpoint
router.post("/admin/create", authMiddleware, adminMiddleware, imageUploadMiddleware, createUserByAdmin);
router.put("/admin/status", authMiddleware, adminMiddleware, updateUserStatus);
router.put("/admin/role", authMiddleware, adminMiddleware, updateUserRole);

// Regular user routes
router.get("/user", authMiddleware, getUserById); 
router.post("/", authMiddleware, imageUploadMiddleware, createUser); 
router.put("/", authMiddleware, imageUploadMiddleware, editUserProfile);
router.delete("/", authMiddleware, deleteUser);
router.put("/updatePassword", authMiddleware, updatePassword);
router.post("/save-fcm-token", authMiddleware, saveFcmToken);

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
router.post("/generateAdventure", generateDailyAdventureRoute);
router.post('/generateTasksForGoal', generateTasksForGoal);

export default router;