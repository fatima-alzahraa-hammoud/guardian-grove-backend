import { Request, Response } from "express";
import { throwError } from "../utils/error";
import { CustomRequest } from "../interfaces/customRequest";
import { User } from "../models/user.model";

//API to get notifications based on type
export const getNotifications = async (req: CustomRequest, res: Response) => {
    try {

        if (!req.user) {
            throwError({ message: "Unauthorized", res, status: 401 });
            return;
        }

        const user = req.user;

        const { type } = req.query;

        let notifications;

        if (type && type !== "All") {
            notifications = user.notifications.filter(n => n.type === type); 
        } else {
            notifications = user.notifications; 
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
export const createNotification = async (req: CustomRequest, res: Response) => {
  try {

    if (!req.user) {
        throwError({ message: "Unauthorized", res, status: 401 });
        return;
    }

    const userId = req.user._id; 
    const { type, message, title } = req.body;

    if (!userId || !type || !message || !title) {
        return throwError({message: "All required fields (userId, type, message, title) must be filled", res, status: 400});
    }

    if (!['tip', 'alert', 'suggestion', 'notification'].includes(type)) {
        return throwError({message: "Invalid notification type", res, status: 400});
    }

    const newNotification = ({
      userId,
      type,
      message,
      title,
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