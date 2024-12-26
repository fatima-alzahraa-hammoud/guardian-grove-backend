import { Document } from "mongoose";

export interface INotification extends Document{
    title: string;
    type: 'tip' | 'alert' | 'suggestion' | 'notification';
    message: string;
    timestamp: Date;
    isRead: boolean;
}