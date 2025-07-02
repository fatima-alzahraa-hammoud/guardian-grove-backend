import { Schema, model, Types } from "mongoose";
import { IFamilyMessage } from "../interfaces/IFamilyMessage";

const messageSchema = new Schema<IFamilyMessage>({
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    senderAvatar: { type: String, required: true },
    content: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['text', 'emoji', 'sticker', 'image', 'file'], 
        default: 'text' 
    },
    timestamp: { type: Date, default: Date.now },
    edited: { type: Boolean, default: false },
    editedAt: { type: Date },
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
    reactions: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        emoji: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }],
    readBy: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        readAt: { type: Date, default: Date.now }
    }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    fileUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number }
}, {
    timestamps: true
});

// Index for better query performance
messageSchema.index({ chatId: 1, timestamp: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ isDeleted: 1 });

export const FamilyMessage = model<IFamilyMessage>("FamilyMessage", messageSchema);