import { Document } from "mongoose";

export interface ITask extends Document{
    title: string;
    description: string;    
    rewards: { stars: number; coins: number };
    type: 'personal' | 'family';
    isCompleted: boolean;
    completedAt?: Date;
}