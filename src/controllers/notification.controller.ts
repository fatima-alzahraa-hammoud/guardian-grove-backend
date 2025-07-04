//APIs for generating notifications using AI
import { Request, Response } from "express";
import { throwError } from "../utils/error";
import { CustomRequest } from "../interfaces/customRequest";
import { User } from "../models/user.model";
import { checkId } from "../utils/checkId";
import { Types } from "mongoose";
import { Family } from "../models/family.model";
import { INotification } from "../interfaces/INotification";
import { createNotificationToMultiple } from "../services/notification.service";

//API to get notifications based on category
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
            return throwError({ message: "No notifications found", res, status: 404 });
        }
        res.status(200).json({ message: "get notifications successfully", notifications });
    } catch (error) {
        return throwError({ message: "Error fetching notifications", res, status: 400 });
    }
};

// Helper function to find notification by ID
const findNotificationById = async (user: any, notificationId: string): Promise<INotification | undefined> => {
    let notification = user.notifications.find((notif: INotification) => notif._id.toString() === notificationId);

    if (!notification && user.familyId) {
        const family = await Family.findById(user.familyId);
        if (family) {
            notification = family.notifications.find((notif: INotification) => notif._id.toString() === notificationId);
        }
    }

    return notification;
};

// API to create notifications (personal or shared)
export const sendNotification = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { userId, familyId, title, message, category, type } = req.body;

        if (type === 'personal' && !checkId({ id: userId, res })) return;
        if (type === 'family' && !checkId({ id: familyId, res })) return;

        if (!category || !message || !title) {
            return throwError({ message: "All required fields (category, message, title) must be filled", res, status: 400 });
        }

        if (!['tip', 'alert', 'suggestion', 'notification'].includes(category)) {
            return throwError({ message: "Invalid notification type", res, status: 400 });
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
            const user = await User.findById(userId);
            if (!user) {
                return throwError({ message: "User not found", res, status: 404 });
            }

            await User.findByIdAndUpdate(userId, {
                $push: { notifications: newNotification },
            });

            if (user.fcmTokens?.length > 0) {
                await createNotificationToMultiple({
                    tokens: user.fcmTokens,
                    title,
                    body: message,
                    data: { category, type: "personal", userId },
                });
            }


            res.status(201).json({ message: 'Notification created successfully', notification: newNotification });
        } else if (type === 'family') {
            const family = await Family.findById(familyId).populate("members");
            if (!family) {
                return throwError({ message: "Family not found", res, status: 404 });
            }

            await Family.findByIdAndUpdate(familyId, {
                $push: { notifications: newNotification },
            });

            // 🔔 Send to all family members who have FCM tokens
            const allTokens: string[] = family.members
                .map((member: any) => member.fcmTokens || [])
                .flat();

            if (allTokens.length > 0) {
                await createNotificationToMultiple({
                    tokens: allTokens,
                    title,
                    body: message,
                    data: { category, type: "family", familyId },
                });
            }

            res.status(201).json({ message: "Shared notification created successfully", notification: newNotification });
        } else {
            return throwError({ message: "Either userId or familyId must be provided", res, status: 400 });
        }
    } catch (error) {
        console.error(error);
        return throwError({ message: "An unknown error occurred while creating notification", res, status: 500 });
    }
};

// API to delete notification
export const deleteNotification = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { notificationId, userId } = req.body;

        if (!checkId({ id: notificationId, res })) return;
        if (!checkId({ id: userId, res })) return;

        const user = await User.findById(userId);

        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        let notificationIndex = user.notifications.findIndex(
            (notification: INotification) => (notification._id as Types.ObjectId).toString() === notificationId
        );

        if (notificationIndex !== -1) {
            const [deletedNotification] = user.notifications.splice(notificationIndex, 1);
            await user.save();
            res.status(200).json({ message: 'Notification deleted from user successfully', DeletedNotification: deletedNotification });
            return;
        }

        // If not found in user notifications, check family notifications
        if (user.familyId) {
            const family = await Family.findById(user.familyId);
            if (family) {
                notificationIndex = family.notifications.findIndex(
                    (notification: INotification) => (notification._id as Types.ObjectId).toString() === notificationId
                );

                if (notificationIndex !== -1) {
                    const [deletedNotification] = family.notifications.splice(notificationIndex, 1);
                    await family.save();
                    res.status(200).json({ message: 'Notification deleted from family successfully', DeletedNotification: deletedNotification });
                    return;
                }
            }
        }

        return throwError({ message: "Notification not found", res, status: 404 });
    } catch (error) {
        console.error(error);
        return throwError({ message: "Error deleting notification", res, status: 500 });
    }
};

// API to update notification
export const updateNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, notificationId, title, message, isRead, category } = req.body;

        if (!checkId({ id: notificationId, res })) return;
        if (!checkId({ id: userId, res })) return;

        const user = await User.findById(userId);
        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        let notification = user.notifications.find((notif: INotification) => notif._id.toString() === notificationId);
        if (notification) {
            if (title) notification.title = title;
            if (message) notification.message = message;
            if (typeof isRead !== "undefined") notification.isRead = isRead;
            if (category) notification.category = category;

            await user.save();
            res.status(200).json({ message: "Notification updated successfully", notification });
            return;
        }

        // If not found in user notifications, check family notifications
        if (user.familyId) {
            const family = await Family.findById(user.familyId);
            if (family) {
                notification = family.notifications.find((notif: INotification) => notif._id.toString() === notificationId);
                if (notification) {
                    if (title) notification.title = title;
                    if (message) notification.message = message;
                    if (typeof isRead !== "undefined") notification.isRead = isRead;
                    if (category) notification.category = category;

                    await family.save();
                    res.status(200).json({ message: "Notification updated successfully", notification });
                    return;
                }
            }
        }

        return throwError({ message: "Notification not found", res, status: 404 });
    } catch (error) {
        return throwError({ message: "Error updating notification", res, status: 500 });
    }
};

// API to mark a notification as done (read)
export const markNotificationAsRead = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { notificationId } = req.body;
        if (!checkId({ id: notificationId, res })) return;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const user = req.user;

        // Find the notification by ID in user notifications
        let notification = await findNotificationById(user, notificationId);

        if (!notification) {
            return throwError({ message: "Notification not found", res, status: 404 });
        }

        // Mark as read
        notification.isRead = true;
        notification.isReadBy.push(user._id);

        if (notification.type === 'family') {
            await Family.findByIdAndUpdate(user.familyId, { $set: { 'notifications.$[elem].isRead': true, 'notifications.$[elem].isReadBy': notification.isReadBy } }, { arrayFilters: [{ 'elem._id': notification._id }] });
        } else {
            await user.save();
        }

        res.status(200).json({
            message: "Notification marked as done",
            notification: notification
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
        user.notifications.forEach((notification: INotification) => {
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
        if (!checkId({ id: notificationId, res })) return;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const user = req.user;

        // Find the notification by ID in user notifications
        let notification = await findNotificationById(user, notificationId);

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

