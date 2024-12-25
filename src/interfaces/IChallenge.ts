import { Document } from "mongoose";

export interface IChallenge extends Document{
    _id: string;
    title: string;
    content: string;
    starsReward: number;
    coinsReward: number;
    isCompleted: boolean;
}