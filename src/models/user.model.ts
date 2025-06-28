import { model, Schema, Types } from "mongoose";
import { IUser } from "../interfaces/IUser";
import { IAdventureProgress, IChallengeProgress } from "../interfaces/IAdventureProgress";
import { IUnlockedAchievement } from "../interfaces/IUnlockedAchievement";
import { IPurchasedItem } from "../interfaces/IPurschasedItem";
import { INotification } from "../interfaces/INotification";
import { INote } from "../interfaces/INote";
import { goalSchema } from "./schemas/goal.schema";
import { notificationSchema } from "./schemas/notification.schema";
import { unlockedAchievementSchema } from "./schemas/unlockedAchievementSchema.schema";
import { bookSchema } from "./schemas/book.schema";
import { drawingSchema } from "./schemas/drawing.schema";
import { coloringSchema } from "./schemas/coloring.schema";
import { storySchema } from "./schemas/story.schema";

const noteSchema: Schema = new Schema<INote>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, required: true, enum: ['personal', 'family'], default: 'personal' },
    isPinned: {type: Boolean, default:false},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const purchasedItemSchema = new Schema<IPurchasedItem>({
    itemId: { type: Schema.Types.ObjectId, ref: "StoreItem", required: true },
    purchasedAt: { type: Date, default: Date.now },
}, { _id: false });

const challengeProgressSchema = new Schema<IChallengeProgress>({
    challengeId: { type: Schema.Types.ObjectId, required: true },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date }
    
}, { _id: false });

const adventureProgressSchema = new Schema<IAdventureProgress>({
    adventureId: { type: Schema.Types.ObjectId, ref: 'Adventure', required: true },
    challenges: { type: [challengeProgressSchema], default: [] },
    isAdventureCompleted: { type: Boolean, default: false },
    status: { type: String, enum: ['in-progress', 'completed'] },
    progress: { type: Number, default: 0 },
    starsReward: { type: Number, default: 10 },
    coinsReward: { type: Number, default: 5 },
} , { _id: false });

const userSchema = new Schema<IUser>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    name: {type: String, required: true },
    email: {type: String, required: [true, "Email is required"],  match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Email is invalid",]},
    isTempPassword: { type: Boolean, default: false },
    passwordChangedAt: { type: Date },
    password: {type: String, required: true},
    birthday:{type: Date, required: true},
    dailyMessage: {type: String, required: true, default: "You are shining💫!"},
    gender:{type: String, enum: ['female', 'male'], required: true},
    role: {type: String, enum: ['parent', 'child', 'admin'], required: true},
    avatar: {type: String, required: true, default:"/assets/images/avatars/parent/avatar1.png"},
    interests: {type: [String], required: true, default: []},
    memberSince: {type: Date, required: true, default: Date.now},
    fcmTokens: { type: [String], default: [] },
    currentLocation:{type: String, required: true, default: "not specified"},
    stars: {type: Number, required: true, default: 0},
    coins: {type: Number, required: true, default: 0},
    nbOfTasksCompleted: {type: Number, required: true, default: 0},
    rankInFamily: {type: Number, required: true, default: 0},
    familyId: { type: Types.ObjectId, ref: "Family", default: null },
    adventures: { type: [adventureProgressSchema], default: [] },
    achievements: { type: [unlockedAchievementSchema], default: [] },
    purchasedItems: { type: [purchasedItemSchema], default: [] },
    notifications: { type: [notificationSchema], default: [] },
    notes: { type: [noteSchema], default: [] },
    goals: { type: [goalSchema], default: [] },
    books: { type: [bookSchema], default: [] }, 
    drawings: { type: [drawingSchema], default: [] }, 
    colorings: { type: [coloringSchema], default: [] }, 
    personalStories: { type: [storySchema], default: [] },
});

userSchema.index({ name: 1, email: 1 }, { unique: true });

export const User = model<IUser>("User", userSchema);