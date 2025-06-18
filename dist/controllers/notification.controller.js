"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationById = exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.updateNotification = exports.deleteNotification = exports.sendNotification = exports.getNotifications = void 0;
const error_1 = require("../utils/error");
const user_model_1 = require("../models/user.model");
const checkId_1 = require("../utils/checkId");
const family_model_1 = require("../models/family.model");
//API to get notifications based on category
const getNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
            return;
        }
        const user = req.user;
        const { category } = req.query;
        let notifications = user.notifications;
        // Fetch family notifications
        const family = yield family_model_1.Family.findById(user.familyId);
        if (family) {
            const familyNotifications = family.notifications;
            notifications = [...notifications, ...familyNotifications];
        }
        // Filter by category if provided
        if (category && category !== "All") {
            notifications = notifications.filter(n => n.category === category);
        }
        if (notifications.length === 0) {
            return (0, error_1.throwError)({ message: "No notifications found", res, status: 404 });
        }
        res.status(200).json({ message: "get notifications successfully", notifications });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Error fetching notifications", res, status: 400 });
    }
});
exports.getNotifications = getNotifications;
// Helper function to find notification by ID
const findNotificationById = (user, notificationId) => __awaiter(void 0, void 0, void 0, function* () {
    let notification = user.notifications.find((notif) => notif._id.toString() === notificationId);
    if (!notification && user.familyId) {
        const family = yield family_model_1.Family.findById(user.familyId);
        if (family) {
            notification = family.notifications.find((notif) => notif._id.toString() === notificationId);
        }
    }
    return notification;
});
// API to create notifications (personal or shared)
const sendNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, familyId, title, message, category, type } = req.body;
        if (type === 'personal' && !(0, checkId_1.checkId)({ id: userId, res }))
            return;
        if (type === 'family' && !(0, checkId_1.checkId)({ id: familyId, res }))
            return;
        if (!category || !message || !title) {
            return (0, error_1.throwError)({ message: "All required fields (category, message, title) must be filled", res, status: 400 });
        }
        if (!['tip', 'alert', 'suggestion', 'notification'].includes(category)) {
            return (0, error_1.throwError)({ message: "Invalid notification type", res, status: 400 });
        }
        const newNotification = {
            title,
            message,
            category,
            type: type || (familyId ? 'family' : 'personal'),
            timestamp: new Date(),
            isRead: false,
            isReadBy: []
        };
        if (type === 'personal') {
            const user = yield user_model_1.User.findById(userId);
            if (!user) {
                return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
            }
            yield user_model_1.User.findOneAndUpdate({ _id: userId }, { $push: { notifications: newNotification } }, { new: true });
            res.status(201).json({ message: 'Notification created successfully', notification: newNotification });
        }
        else if (type === 'family') {
            const family = yield family_model_1.Family.findById(familyId);
            if (!family) {
                return (0, error_1.throwError)({ message: "Family not found", res, status: 404 });
            }
            yield family_model_1.Family.findOneAndUpdate({ _id: familyId }, { $push: { notifications: newNotification } }, { new: true });
            res.status(201).json({ message: "Shared notification created successfully", notification: newNotification });
        }
        else {
            return (0, error_1.throwError)({ message: "Either userId or familyId must be provided", res, status: 400 });
        }
    }
    catch (error) {
        console.error(error);
        return (0, error_1.throwError)({ message: "An unknown error occurred while creating notification", res, status: 500 });
    }
});
exports.sendNotification = sendNotification;
// API to delete notification
const deleteNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId, userId } = req.body;
        if (!(0, checkId_1.checkId)({ id: notificationId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: userId, res }))
            return;
        const user = yield user_model_1.User.findById(userId);
        if (!user) {
            return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
        }
        let notificationIndex = user.notifications.findIndex((notification) => notification._id.toString() === notificationId);
        if (notificationIndex !== -1) {
            const [deletedNotification] = user.notifications.splice(notificationIndex, 1);
            yield user.save();
            res.status(200).json({ message: 'Notification deleted from user successfully', DeletedNotification: deletedNotification });
            return;
        }
        // If not found in user notifications, check family notifications
        if (user.familyId) {
            const family = yield family_model_1.Family.findById(user.familyId);
            if (family) {
                notificationIndex = family.notifications.findIndex((notification) => notification._id.toString() === notificationId);
                if (notificationIndex !== -1) {
                    const [deletedNotification] = family.notifications.splice(notificationIndex, 1);
                    yield family.save();
                    res.status(200).json({ message: 'Notification deleted from family successfully', DeletedNotification: deletedNotification });
                    return;
                }
            }
        }
        return (0, error_1.throwError)({ message: "Notification not found", res, status: 404 });
    }
    catch (error) {
        console.error(error);
        return (0, error_1.throwError)({ message: "Error deleting notification", res, status: 500 });
    }
});
exports.deleteNotification = deleteNotification;
// API to update notification
const updateNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, notificationId, title, message, isRead, category } = req.body;
        if (!(0, checkId_1.checkId)({ id: notificationId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: userId, res }))
            return;
        const user = yield user_model_1.User.findById(userId);
        if (!user) {
            return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
        }
        let notification = user.notifications.find((notif) => notif._id.toString() === notificationId);
        if (notification) {
            if (title)
                notification.title = title;
            if (message)
                notification.message = message;
            if (typeof isRead !== "undefined")
                notification.isRead = isRead;
            if (category)
                notification.category = category;
            yield user.save();
            res.status(200).json({ message: "Notification updated successfully", notification });
            return;
        }
        // If not found in user notifications, check family notifications
        if (user.familyId) {
            const family = yield family_model_1.Family.findById(user.familyId);
            if (family) {
                notification = family.notifications.find((notif) => notif._id.toString() === notificationId);
                if (notification) {
                    if (title)
                        notification.title = title;
                    if (message)
                        notification.message = message;
                    if (typeof isRead !== "undefined")
                        notification.isRead = isRead;
                    if (category)
                        notification.category = category;
                    yield family.save();
                    res.status(200).json({ message: "Notification updated successfully", notification });
                    return;
                }
            }
        }
        return (0, error_1.throwError)({ message: "Notification not found", res, status: 404 });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Error updating notification", res, status: 500 });
    }
});
exports.updateNotification = updateNotification;
// API to mark a notification as done (read)
const markNotificationAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId } = req.body;
        if (!(0, checkId_1.checkId)({ id: notificationId, res }))
            return;
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const user = req.user;
        // Find the notification by ID in user notifications
        let notification = yield findNotificationById(user, notificationId);
        if (!notification) {
            return (0, error_1.throwError)({ message: "Notification not found", res, status: 404 });
        }
        // Mark as read
        notification.isRead = true;
        notification.isReadBy.push(user._id);
        if (notification.type === 'family') {
            yield family_model_1.Family.findByIdAndUpdate(user.familyId, { $set: { 'notifications.$[elem].isRead': true, 'notifications.$[elem].isReadBy': notification.isReadBy } }, { arrayFilters: [{ 'elem._id': notification._id }] });
        }
        else {
            yield user.save();
        }
        res.status(200).json({
            message: "Notification marked as done",
            notification: notification
        });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Error marking notification as done", res, status: 500 });
    }
});
exports.markNotificationAsRead = markNotificationAsRead;
// API to mark all notifications as read
const markAllNotificationsAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Find user
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const user = req.user;
        // Mark all notifications as read
        user.notifications.forEach((notification) => {
            notification.isRead = true;
        });
        yield user.save();
        res.status(200).json({
            message: "All notifications marked as read",
            notifications: user.notifications
        });
    }
    catch (error) {
        console.log(error);
        return (0, error_1.throwError)({ message: "Error marking all notifications as read", res, status: 500 });
    }
});
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
// API to get a notification by ID
const getNotificationById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId } = req.body;
        if (!(0, checkId_1.checkId)({ id: notificationId, res }))
            return;
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const user = req.user;
        // Find the notification by ID in user notifications
        let notification = yield findNotificationById(user, notificationId);
        if (!notification) {
            return (0, error_1.throwError)({ message: "Notification not found", res, status: 404 });
        }
        res.status(200).json({
            message: "Notification retrieved successfully",
            notification
        });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Error retrieving notification", res, status: 500 });
    }
});
exports.getNotificationById = getNotificationById;
