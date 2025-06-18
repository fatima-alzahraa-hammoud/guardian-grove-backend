"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const goal_schema_1 = require("./schemas/goal.schema");
const notification_schema_1 = require("./schemas/notification.schema");
const unlockedAchievementSchema_schema_1 = require("./schemas/unlockedAchievementSchema.schema");
const book_schema_1 = require("./schemas/book.schema");
const drawing_schema_1 = require("./schemas/drawing.schema");
const coloring_schema_1 = require("./schemas/coloring.schema");
const story_schema_1 = require("./schemas/story.schema");
const noteSchema = new mongoose_1.Schema({
    _id: { type: mongoose_1.Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, required: true, enum: ['personal', 'family'], default: 'personal' },
    isPinned: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
const purchasedItemSchema = new mongoose_1.Schema({
    itemId: { type: mongoose_1.Schema.Types.ObjectId, ref: "StoreItem", required: true },
    purchasedAt: { type: Date, default: Date.now },
}, { _id: false });
const challengeProgressSchema = new mongoose_1.Schema({
    challengeId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date }
}, { _id: false });
const adventureProgressSchema = new mongoose_1.Schema({
    adventureId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Adventure', required: true },
    challenges: { type: [challengeProgressSchema], default: [] },
    isAdventureCompleted: { type: Boolean, default: false },
    status: { type: String, enum: ['in-progress', 'completed'] },
    progress: { type: Number, default: 0 },
    starsReward: { type: Number, default: 10 },
    coinsReward: { type: Number, default: 5 },
}, { _id: false });
const userSchema = new mongoose_1.Schema({
    _id: { type: mongoose_1.Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    email: { type: String, required: [true, "Email is required"], match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Email is invalid",] },
    isTempPassword: { type: Boolean, default: false },
    passwordChangedAt: { type: Date },
    password: { type: String, required: true },
    birthday: { type: Date, required: true },
    dailyMessage: { type: String, required: true, default: "You are shining💫!" },
    gender: { type: String, enum: ['female', 'male'], required: true },
    role: { type: String, enum: ['parent', 'child', 'admin'], required: true },
    avatar: { type: String, required: true, default: "/assets/images/avatars/parent/avatar1.png" },
    interests: { type: [String], required: true, default: [] },
    memberSince: { type: Date, required: true, default: Date.now },
    currentLocation: { type: String, required: true, default: "not specified" },
    stars: { type: Number, required: true, default: 0 },
    coins: { type: Number, required: true, default: 0 },
    nbOfTasksCompleted: { type: Number, required: true, default: 0 },
    rankInFamily: { type: Number, required: true, default: 0 },
    familyId: { type: mongoose_1.Types.ObjectId, ref: "Family", default: null },
    adventures: { type: [adventureProgressSchema], default: [] },
    achievements: { type: [unlockedAchievementSchema_schema_1.unlockedAchievementSchema], default: [] },
    purchasedItems: { type: [purchasedItemSchema], default: [] },
    notifications: { type: [notification_schema_1.notificationSchema], default: [] },
    notes: { type: [noteSchema], default: [] },
    goals: { type: [goal_schema_1.goalSchema], default: [] },
    books: { type: [book_schema_1.bookSchema], default: [] },
    drawings: { type: [drawing_schema_1.drawingSchema], default: [] },
    colorings: { type: [coloring_schema_1.coloringSchema], default: [] },
    personalStories: { type: [story_schema_1.storySchema], default: [] },
});
userSchema.index({ name: 1, email: 1 }, { unique: true });
exports.User = (0, mongoose_1.model)("User", userSchema);
