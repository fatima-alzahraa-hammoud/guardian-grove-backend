import { Types } from "mongoose";

export interface IUnlockedAchievement {
    achievementId: Types.ObjectId;
    unlockedAt: Date;
}