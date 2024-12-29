import { Document, Types } from "mongoose";
import { IAdventureProgress } from "./IAdventureProgress";
import { IUnlockedAchievement } from "./IUnlockedAchievement";
import { IPurchasedItem } from "./IPurschasedItem";
import { INotification } from "./INotification";
import { INote } from "./INote";
import { IGoal } from "./IGoal";

export interface IUser extends Document{
    _id: Types.ObjectId;
    name: string;
    email: string;
    password: string;
    birthday: Date;
    gender: string;
    role: string;
    avatar: string; 
    interests: string[];
    memberSince: Date;
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
}