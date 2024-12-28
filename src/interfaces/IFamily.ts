import { Document, Types } from "mongoose";
import { IUser } from "./IUser";
import { INotification } from "./INotification";
import { IGoal } from "./IGoal";
import { IAchievement } from "./IAchievements";
import { IUnlockedAchievement } from "./IUnlockedAchievement";

export interface IFamily extends Document {
    _id: Types.ObjectId;
    familyName: string;
    members: Array<{
        _id: Types.ObjectId;
        name: string;
        role: string;
    }>;
    email: string;
    createdAt: Date;
    notifications: INotification[];
    goals: IGoal[];
    achievements: IUnlockedAchievement[];  
}
