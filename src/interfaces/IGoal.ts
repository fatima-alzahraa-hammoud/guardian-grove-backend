import { Types } from "mongoose";
import { ITask } from "./ITask";

export interface IGoal extends Document {
    _id: Types.ObjectId;
    title: string;
    description: string;
    type: 'personal' | 'family';
    tasks: ITask[];
    isCompleted: boolean;
    createdAt: Date;
    completedAt?: Date;
    dueDate: Date;
    rewards: { stars: number; coins: number, achievementName?: string; achievementId?: string;  };
    progress: number;
}