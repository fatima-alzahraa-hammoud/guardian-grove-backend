import { Document, Types } from "mongoose";

export interface IAchievement extends Document{
    _id: Types.ObjectId;
    title: string;
    description: string;
    starsReward?: number;
    coinsReward?: number;
    criteria: string; 
    photo: string;
}
