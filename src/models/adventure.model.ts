import { model, Schema } from "mongoose";
import { IChallenge } from "../interfaces/IChallenge";
import { IAdventure } from "../interfaces/IAdventure";

const challengeSchema = new Schema<IChallenge>({
    title: { type: String, required: true },
    content: { type: String, required: true },
    starsReward: { type: Number, required: true, default: 2 },
    coinsReward: { type: Number, required: true, default: 1 },
});

const adventureSchema = new Schema<IAdventure>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    starsReward: { type: Number, required: true, default: 10 },
    coinsReward: { type: Number, required: true, default: 5 },
    startDate: { type: Date, default: Date.now },
    // Automatically calculate due date (24 hours after creation)
    endDate: { 
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    challenges: { type: [challengeSchema], required: true, default: [] },
});

export const Adventure = model<IAdventure>("Adventure", adventureSchema);