import { Document } from "mongoose";

export interface IAchievement extends Document{
    _id: string;
    title: string;
    description: string;
    starsReward?: number;
    coinsReward?: number;
    criteria: string; 
    photo: string;
}
