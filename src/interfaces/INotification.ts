import { Document } from "mongoose";

interface INotification extends Document{
    type: 'tip' | 'alert' | 'suggestion' | 'notification';
    message: string;
    timestamp: Date;
    isRead: boolean;
  }