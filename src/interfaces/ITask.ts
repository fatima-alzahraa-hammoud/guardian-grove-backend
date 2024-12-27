import { Document } from "mongoose";

export interface ITask extends Document{
    title: string;
    description: string;
    starsReward: number;
    coinsReward: number;
    type: 'personal' | 'family';
    isCompleted: boolean;
    completedAt?: Date;
}