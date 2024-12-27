import { ITask } from "./ITask";

export interface IGoal extends Document {
    title: string;
    description: string;
    tasks: ITask[];
    isCompleted: boolean;
    completeBy: Date;
    rewards: { stars: number; coins: number };
    badge?: string;
}