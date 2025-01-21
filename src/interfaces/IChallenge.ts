import { Document, Types } from "mongoose";

export interface IChallenge extends Document{
    _id: Types.ObjectId;
    title: string;
    content: string;
    starsReward: number;
    coinsReward: number;
}