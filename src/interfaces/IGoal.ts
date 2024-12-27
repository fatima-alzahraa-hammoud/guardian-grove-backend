import { ITask } from "./ITask";

export interface IGoal extends Document {
    title: string;
    description: string;
    type: 'personal' | 'family';
    tasks: ITask[];
    isCompleted: boolean;
    completeBy: Date;
    dueDate: Date;
    rewards: { stars: number; coins: number, badge?: string };
}