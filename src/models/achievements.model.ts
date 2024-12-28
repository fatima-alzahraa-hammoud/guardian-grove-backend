import { model, Schema } from "mongoose";
import { IAchievement } from "../interfaces/IAchievements";

const achievementSchema = new Schema<IAchievement>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
    type: { type: String, required: true, enum: ['personal', 'family'], default: 'personal' },
    description: { type: String, required: true },
    starsReward: { type: Number, default: 0 },
    coinsReward: { type: Number, default: 0 },
    criteria: { type: String, required: true },
    photo: { type: String, required: true },
});

export const Achievement = model<IAchievement>("Achievement", achievementSchema);