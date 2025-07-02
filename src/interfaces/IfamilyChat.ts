import { Types } from "mongoose";

export interface IFamilyChat {
    _id: Types.ObjectId;
    name: string;
    type: 'direct' | 'group';
    members: Types.ObjectId[];
    familyId: Types.ObjectId;
    avatar?: string;
    description?: string;
    lastMessage?: {
        messageId: Types.ObjectId;
        content: string;
        senderId: Types.ObjectId;
        senderName: string;
        timestamp: Date;
        type: 'text' | 'emoji' | 'sticker' | 'image' | 'file';
    };
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    mutedBy: Types.ObjectId[]; // Users who muted this chat
    pinnedBy: Types.ObjectId[]; // Users who pinned this chat
    settings: {
        allowFileSharing: boolean;
        allowImageSharing: boolean;
        maxFileSize: number; // in MB
    };
}
