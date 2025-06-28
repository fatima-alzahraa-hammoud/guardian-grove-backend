import { Document, Types } from "mongoose";
import { IAdventureProgress } from "./IAdventureProgress";
import { IUnlockedAchievement } from "./IUnlockedAchievement";
import { IPurchasedItem } from "./IPurschasedItem";
import { INotification } from "./INotification";
import { INote } from "./INote";
import { IGoal } from "./IGoal";
import { IBook } from "./IBook";
import { IDrawing } from "./IDrawing";
import { IColoring } from "./IColoring";
import { IStory } from "./IStory";

export interface IUser extends Document{
    _id: Types.ObjectId;
    name: string;
    email: string;
    password: string;
    isTempPassword: boolean;
    passwordChangedAt: Date | null;
    birthday: Date;
    dailyMessage: string;
    gender: string;
    role: string;
    avatar: string; 
    interests: string[];
    memberSince: Date;
    fcmTokens: string[]; // Firebase Cloud Messaging tokens for push notifications
    currentLocation?: string;
    stars: number;
    coins: number;
    nbOfTasksCompleted: number;
    rankInFamily: number;
    familyId: Types.ObjectId | null;
    adventures: IAdventureProgress[];
    achievements: IUnlockedAchievement[];
    purchasedItems: IPurchasedItem[];
    notifications: INotification[];
    notes: INote[];
    goals: IGoal[];
    books: IBook[];
    drawings: IDrawing[];
    colorings: IColoring[];
    personalStories: IStory[];
}