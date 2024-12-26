import { ObjectId } from "mongoose";

export interface IChallengeProgress {
    challengeId: String;  
    isCompleted: boolean;
    completedAt?: Date;
}

export interface IAdventureProgress {
    adventureId: String; 
    challenges: IChallengeProgress[];
    isAdventureCompleted: boolean;
    status: 'in-progress' | 'completed';
    progress: number;
}
