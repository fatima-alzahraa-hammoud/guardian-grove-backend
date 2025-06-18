"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Family = void 0;
const mongoose_1 = require("mongoose");
const goal_schema_1 = require("./schemas/goal.schema");
const notification_schema_1 = require("./schemas/notification.schema");
const unlockedAchievementSchema_schema_1 = require("./schemas/unlockedAchievementSchema.schema");
const story_schema_1 = require("./schemas/story.schema");
const familySchema = new mongoose_1.Schema({
    _id: { type: mongoose_1.Schema.Types.ObjectId, auto: true },
    familyName: { type: String, required: true, unique: true },
    members: [
        {
            _id: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
            name: { type: String, required: true },
            role: { type: String, required: true, enum: ['parent', 'admin', 'child'] },
            gender: { type: String, required: true, enum: ['female', 'male'] },
            avatar: { type: String, required: true },
        },
    ],
    email: { type: String, required: true, unique: true },
    createdAt: { type: Date, required: true },
    totalStars: { type: Number, default: 0 },
    tasks: { type: Number, default: 0 },
    notifications: { type: [notification_schema_1.notificationSchema], default: [] },
    goals: { type: [goal_schema_1.goalSchema], default: [] },
    achievements: { type: [unlockedAchievementSchema_schema_1.unlockedAchievementSchema], default: [] },
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
    sharedStories: { type: [story_schema_1.storySchema], default: [] },
});
// Ensure virtuals are included in JSON response
familySchema.set("toJSON", { virtuals: true });
familySchema.set("toObject", { virtuals: true });
exports.Family = (0, mongoose_1.model)("Family", familySchema);
