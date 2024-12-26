import { model, Schema } from "mongoose";
import { IUser } from "../interfaces/IUser";
import { IAdventureProgress, IChallengeProgress } from "../interfaces/IAdventureProgress";
import { IUnlockedAchievement } from "../interfaces/IUnlockedAchievement";
import { IPurchasedItem } from "../interfaces/IPurschasedItem";

const purchasedItemSchema = new Schema<IPurchasedItem>({
    itemId: { type: Schema.Types.ObjectId, ref: "StoreItem", required: true },
    purchasedAt: { type: Date, default: Date.now },
}, { _id: false });

const unlockedAchievementSchema = new Schema<IUnlockedAchievement>({
    achievementId: { type: Schema.Types.ObjectId, ref: "Achievement", required: true },
    unlockedAt: { type: Date, default: Date.now },
}, {_id: false});


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
} , { _id: false });

const userSchema = new Schema<IUser>({
    name: {type: String, required: true },
    email: {type: String, required: [true, "Email is required"],  match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Email is invalid",]},
    password: {type: String, required: true},
    birthday:{type: Date, required: true},
    gender:{type: String, enum: ['female', 'male'], required: true},
    role: {type: String, enum: ['user', 'owner', 'parent', 'child', 'grandfather', 'grandmother', 'admin'],required: true},
    avatar: {type: String, required: true},
    interests: {type: [String], required: true, default: []},
    memberSince: {type: Date, required: true, default: Date.now},
    currentLocation:{type: String, required: true, default: "not specified"},
    stars: {type: Number, required: true, default: 0},
    coins: {type: Number, required: true, default: 0},
    rankInFamily: {type: Number, required: true, default: 0},
    adventures: { type: [adventureProgressSchema], default: [] },
    achievements: { type: [unlockedAchievementSchema], default: [] },
    purchasedItems: { type: [purchasedItemSchema], default: [] },
});

userSchema.index({ name: 1, email: 1 }, { unique: true });

export const User = model<IUser>("User", userSchema);