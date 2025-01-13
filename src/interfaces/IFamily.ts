import { Document, Types } from "mongoose";
import { IUser } from "./IUser";
import { INotification } from "./INotification";
import { IGoal } from "./IGoal";
import { IAchievement } from "./IAchievements";
import { IUnlockedAchievement } from "./IUnlockedAchievement";
import { IStory } from "./IStory";

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export interface IFamily extends Document {
    _id: Types.ObjectId;
    familyName: string;
    members: Array<{
        _id: Types.ObjectId;
        name: string;
        role: string;
        gender: string;
    }>;
    email: string;
    createdAt: Date;
    totalStars: number;
    tasks: number;
    notifications: INotification[];
    goals: IGoal[];
    achievements: IUnlockedAchievement[];
    stars: Record<TimePeriod, number>;
    taskCounts: Record<TimePeriod, number>;
    familyAvatar: string;
    sharedStories: IStory[];
}
