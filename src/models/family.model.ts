import { Schema, model, Types } from "mongoose";
import { IFamily } from "../interfaces/IFamily";
import { User } from "./user.model";
import { goalSchema } from "./schemas/goal.schema";
import { notificationSchema } from "./schemas/notification.schema";
import { unlockedAchievementSchema } from "./schemas/unlockedAchievementSchema.schema";

const familySchema = new Schema<IFamily>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    familyName: { type: String, required: true, unique: true },
    members: [
        {
            _id: { type: Types.ObjectId, ref: "User", required: true },
            name: { type: String, required: true },
            role: { type: String, required: true, enum: ['parent', 'grandparent', 'admin', 'child'] },
        },
    ],
    email: { type: String, required: true, unique: true },
    createdAt: { type: Date, required: true },
    totalStars: { type: Number, default: 0 },
    tasks: { type: Number, default: 0 },
    notifications: { type: [notificationSchema], default: [] },
    goals: { type: [goalSchema], default: [] },
    achievements: { type: [unlockedAchievementSchema], default: [] },
    stars: {
        daily: { type: Number, default: 0 },
        weekly: { type: Number, default: 0 },
        monthly: { type: Number, default: 0 },
        yearly: { type: Number, default: 0 }
    },
    taskCounts: {
        daily: { type: Number, default: 0 },
        weekly: { type: Number, default: 0 },
        monthly: { type: Number, default: 0 },
        yearly: { type: Number, default: 0 }
    },
    familyAvatar: { type: String, required: true },
});

// Ensure virtuals are included in JSON response
familySchema.set("toJSON", { virtuals: true });
familySchema.set("toObject", { virtuals: true });

export const Family = model<IFamily>("Family", familySchema);
