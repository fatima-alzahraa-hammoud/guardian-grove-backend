import { Schema } from "mongoose";
import { IChallenge } from "../interfaces/IChallenge";

const challengeSchema = new Schema<IChallenge>({
    title: { type: String, required: true },
    content: { type: String, required: true },
    starsReward: { type: Number, required: true, default: 10 },
    coinsReward: { type: Number, required: true, default: 10 },
    isCompleted: { type: Boolean, required: true, default: false },
});