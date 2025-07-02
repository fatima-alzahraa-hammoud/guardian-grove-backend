import { Schema, model, Types } from "mongoose";
import { IFamily } from "../interfaces/IFamily";
import { User } from "./user.model";
import { goalSchema } from "./schemas/goal.schema";
import { notificationSchema } from "./schemas/notification.schema";
import { unlockedAchievementSchema } from "./schemas/unlockedAchievementSchema.schema";
import { storySchema } from "./schemas/story.schema";
import { journalEntrySchema } from "./schemas/journalEntry.schema";
import { bondingEventSchema } from "./schemas/bondingEventSchema";

const familySchema = new Schema<IFamily>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    familyName: { type: String, required: true, unique: true },
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
    sharedStories: { type: [storySchema], default: [] },
    journalEntries: { type: [journalEntrySchema], default: [] },
    bondingEvents: [bondingEventSchema],
});

// virtual field to get members dynamically
familySchema.virtual('members', {
    ref: 'User',
    localField: '_id',
    foreignField: 'familyId'
});

// Ensure virtuals are included in JSON response
familySchema.set("toJSON", { virtuals: true });
familySchema.set("toObject", { virtuals: true });

export const Family = model<IFamily>("Family", familySchema);
