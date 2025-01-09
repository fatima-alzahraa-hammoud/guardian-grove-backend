import { Document, Types } from "mongoose";

export interface ITask extends Document{
    _id: Types.ObjectId;
    title: string;
    description: string;    
    rewards: { stars: number; coins: number };
    type: 'personal' | 'family';
    isCompleted: boolean;
    createdAt?: Date;
    completedAt?: Date;
}