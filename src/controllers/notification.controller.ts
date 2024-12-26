import { Request, Response } from "express";
import { throwError } from "../utils/error";
import { CustomRequest } from "../interfaces/customRequest";

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