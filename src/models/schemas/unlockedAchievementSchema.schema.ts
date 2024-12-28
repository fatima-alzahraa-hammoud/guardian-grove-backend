import { Schema } from "mongoose";
import { IUnlockedAchievement } from "../../interfaces/IUnlockedAchievement";

export const unlockedAchievementSchema = new Schema<IUnlockedAchievement>({
    achievementId: { type: Schema.Types.ObjectId, ref: "Achievement", required: true },
    unlockedAt: { type: Date, default: Date.now },
}, {_id: false});