import { ObjectId, Types } from "mongoose";

export interface IChallengeProgress {
    challengeId: Types.ObjectId;  
    isCompleted: boolean;
    completedAt?: Date;
}

export interface IAdventureProgress {
    adventureId: Types.ObjectId; 
    challenges: IChallengeProgress[];
    isAdventureCompleted: boolean;
    status: 'in-progress' | 'completed';
    starsReward: number;
    coinsReward: number;
    progress: number;
}
