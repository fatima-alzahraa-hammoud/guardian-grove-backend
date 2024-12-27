import { Types } from "mongoose";
import { ITask } from "./ITask";

export interface IGoal extends Document {
    _id: Types.ObjectId;
    title: string;
    description: string;
    type: 'personal' | 'family';
    tasks: ITask[];
    isCompleted: boolean;
    completeBy: Date;
    dueDate: Date;
    rewards: { stars: number; coins: number, badge?: string };
}