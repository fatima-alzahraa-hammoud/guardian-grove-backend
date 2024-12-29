import { Document, Types } from "mongoose";

export interface INotification extends Document{
    _id : Types.ObjectId;
    title: string;
    type: 'personal' | 'family';
    category: 'tip' | 'alert' | 'suggestion' | 'notification';
    message: string;
    timestamp: Date;
    isRead: boolean;
    isReadBy: Types.ObjectId[];
}