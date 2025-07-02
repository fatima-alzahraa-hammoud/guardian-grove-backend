import { Types } from "mongoose";

export interface IFamilyMessage {
    _id: Types.ObjectId;
    chatId: Types.ObjectId;
    senderId: Types.ObjectId;
    senderName: string;
    senderAvatar: string;
    content: string;
    type: 'text' | 'emoji' | 'sticker' | 'image' | 'file';
    timestamp: Date;
    edited?: boolean;
    editedAt?: Date;
    replyTo?: Types.ObjectId; // Reference to another message
    reactions: {
        userId: Types.ObjectId;
        emoji: string;
        timestamp: Date;
    }[];
    readBy: {
        userId: Types.ObjectId;
        readAt: Date;
    }[];
    isDeleted: boolean;
    deletedAt?: Date;
    fileUrl?: string; // For image/file messages
    fileName?: string; // Original file name
    fileSize?: number; // File size in bytes
}