"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const notification_controller_1 = require("../controllers/notification.controller");
const adminMiddleware_1 = require("../middlewares/adminMiddleware");
const router = express_1.default.Router();
router.get("/", auth_middleware_1.authMiddleware, notification_controller_1.getNotifications);
router.post("/", auth_middleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, notification_controller_1.sendNotification);
router.delete("/", auth_middleware_1.authMiddleware, notification_controller_1.deleteNotification);
router.put("/", auth_middleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, notification_controller_1.updateNotification);
router.post("/markAsRead", auth_middleware_1.authMiddleware, notification_controller_1.markNotificationAsRead);
router.post("/markAllAsRead", auth_middleware_1.authMiddleware, notification_controller_1.markAllNotificationsAsRead);
router.get("/notification", auth_middleware_1.authMiddleware, notification_controller_1.getNotificationById);
exports.default = router;
