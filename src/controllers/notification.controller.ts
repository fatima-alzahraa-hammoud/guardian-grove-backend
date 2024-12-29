//APIs for generating notifications using AI
import { Request, Response } from "express";
import { throwError } from "../utils/error";
import { CustomRequest } from "../interfaces/customRequest";
import { User } from "../models/user.model";
import { checkId } from "../utils/checkId";
import { Types } from "mongoose";
import { Family } from "../models/family.model";

//API to get notifications based on type
export const getNotifications = async (req: CustomRequest, res: Response): Promise<void> => {
    try {

        if (!req.user) {
            throwError({ message: "Unauthorized", res, status: 401 });
            return;
        }

        const user = req.user;

        const { category } = req.query;

        let notifications = user.notifications;

        // Fetch family notifications
        const family = await Family.findById(user.familyId);
        if (family) {
            const familyNotifications = family.notifications;
            notifications = [...notifications, ...familyNotifications];
        }

        // Filter by category if provided
        if (category && category !== "All") {
            notifications = notifications.filter(n => n.category === category);
        }

        if (notifications.length === 0) {
            return throwError({message: "No notifications found", res, status: 404});
        }
        res.status(200).json({message: "get notifications successfully",  notifications });
    } catch (error) {
        return throwError({message: "Error fetching notifications", res, status: 400});
    }
};

//API to create notifications
export const sendNotification = async (req: CustomRequest, res: Response): Promise<void> => {
    try {

        const { userId, title, message, category, type } = req.body;
        
        if(!checkId({id: userId, res})) return;

        const user = await User.findById(userId);
        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        if (!category || !message || !title) {
            return throwError({message: "All required fields (type, message, title) must be filled", res, status: 400});
        }

        if (!['tip', 'alert', 'suggestion', 'notification'].includes(category)) {
            return throwError({message: "Invalid notification type", res, status: 400});
        }

        const newNotification = ({
            userId,
            category,
            message,
            title,
            type : type || 'personal',
            timestamp: new Date(),
            isRead: false,
        });

        await User.findOneAndUpdate(
            { _id: userId },
            { $push: { notifications: newNotification } },
            { new: true } 
        );

        res.status(201).json({ message: 'Notification created successfully', notification: newNotification });
    } catch (error) {
        console.error(error); 
        return throwError({message: "An unknown error occurred while creating notification", res, status: 500});
    }
};

//API to send shared notification
export const sendSharedNotification = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { familyId, title, message, category } = req.body;

        if(!checkId({id: familyId, res})) return;

        const family = await Family.findById(familyId);
        if (!family) {
            return throwError({ message: "Family not found", res, status: 404 });
        }

        const newNotification = ({
            _id: new Types.ObjectId(),
            title,
            message,
            category,
            type: 'family',
            timestamp: new Date(),
            isRead: false,
            isReadBy: []
        });

        await Family.findOneAndUpdate(
            { _id: familyId },
            { $push: { notifications: newNotification } },
            { new: true } 
        );
        
        res.status(201).json({ message: "Shared notification created successfully", notification: newNotification });
    } catch (error) {
        return throwError({ message: "Error creating shared notification", res, status: 500 });
    }
};


//API to delete notification
export const deleteNotification = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { notificationId, userId } = req.body;

        if(!checkId({id: notificationId, res})) return;
        if(!checkId({id: userId, res})) return;

        const user = await User.findById(userId);

        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }
    
        const notificationIndex = user.notifications.findIndex(
            (notification) => (notification._id as Types.ObjectId).toString() === notificationId
        );

        if (notificationIndex === -1) {
            return throwError({ message: "Notification not found", res, status: 404 });
        }

        const [deletedNotification] = user.notifications.splice(notificationIndex, 1);

        await user.save();

    
        res.status(200).json({ message: 'Notification deleted successfully', DeletedNotification: deletedNotification });
    } catch (error) {
        console.error(error);
        return throwError({message: "Error deleting notification", res, status: 500});
    }
};

// API to update notification
export const updateNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, notificationId, title, message, isRead, category } = req.body;

        if(!checkId({id: notificationId, res})) return;
        if(!checkId({id: userId, res})) return;

        const user = await User.findById(userId);
        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        const notification = user.notifications.find(notif => notif._id.toString() === notificationId);
        if (!notification) {
            return throwError({ message: "Notification not found", res, status: 404 });
        }

        if (title) notification.title = title;
        if (message) notification.message = message;
        if (typeof isRead !== "undefined") notification.isRead = isRead;
        if (category) notification.category = category;

        await user.save();

        res.status(200).json({
            message: "Notification updated successfully",
            notification,
        });
    } catch (error) {
        return throwError({ message: "Error updating notification", res, status: 500 });
    }
};

// API to mark a notification as done (read)
export const markNotificationAsDone = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const {notificationId } = req.body;

        // Find user
        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const user = req.user;
        
        // Find the notification by ID
        const notification = user.notifications.find(notif => notif._id.toString() === notificationId);
        if (!notification) {
            return throwError({ message: "Notification not found", res, status: 404 });
        }

        // Mark as read
        notification.isRead = true;
        await user.save();

        res.status(200).json({
            message: "Notification marked as done",
            notification
        });
    } catch (error) {
        return throwError({ message: "Error marking notification as done", res, status: 500 });
    }
};


// API to mark all notifications as read
export const markAllNotificationsAsRead = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        // Find user
        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const user = req.user;

        // Mark all notifications as read
        user.notifications.forEach(notification => {
            notification.isRead = true;
        });

        await user.save();

        res.status(200).json({
            message: "All notifications marked as read",
            notifications: user.notifications
        });
    } catch (error) {
        console.log(error)
        return throwError({ message: "Error marking all notifications as read", res, status: 500 });
    }
};

// API to get a notification by ID
export const getNotificationById = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { notificationId } = req.body;
        if(!checkId({id: notificationId, res})) return;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const user = req.user;

        // Find the notification by ID in user notifications
        let notification = user.notifications.find(notif => notif._id.toString() === notificationId);

        // If not found in user notifications, check family notifications
        if (!notification && user.familyId) {
            const family = await Family.findById(user.familyId);
            if (family) {
                notification = family.notifications.find(notif => notif._id.toString() === notificationId);
            }
        }

        if (!notification) {
            return throwError({ message: "Notification not found", res, status: 404 });
        }

        res.status(200).json({
            message: "Notification retrieved successfully",
            notification
        });
    } catch (error) {
        return throwError({ message: "Error retrieving notification", res, status: 500 });
    }
};

