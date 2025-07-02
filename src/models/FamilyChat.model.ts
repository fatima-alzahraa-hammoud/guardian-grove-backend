import { Schema, model, Types } from "mongoose";
import { IFamilyChat } from "../interfaces/IfamilyChat";

const chatSchema = new Schema<IFamilyChat>({
    name: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['direct', 'group'], 
        required: true 
    },
    members: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    }],
    familyId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Family', 
        required: true 
    },
    avatar: { type: String },
    description: { type: String },
    lastMessage: {
        messageId: { type: Schema.Types.ObjectId, ref: 'Message' },
        content: { type: String },
        senderId: { type: Schema.Types.ObjectId, ref: 'User' },
        senderName: { type: String },
        timestamp: { type: Date },
        type: { 
            type: String, 
            enum: ['text', 'emoji', 'sticker', 'image', 'file']
        }
    },
    createdBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    isActive: { type: Boolean, default: true },
    mutedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    pinnedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    settings: {
        allowFileSharing: { type: Boolean, default: true },
        allowImageSharing: { type: Boolean, default: true },
        maxFileSize: { type: Number, default: 10 } // 10MB default
    }
}, {
    timestamps: true
});

// Indexes for better performance
chatSchema.index({ familyId: 1 });
chatSchema.index({ members: 1 });
chatSchema.index({ type: 1, familyId: 1 });
chatSchema.index({ 'lastMessage.timestamp': -1 });

export const FamilyChat = model<IFamilyChat>("FamilyChat", chatSchema);