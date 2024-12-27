import { Schema } from "mongoose";
import { IGoal } from "../../interfaces/IGoal";
import { taskSchema } from "./task.schema";

export const goalSchema = new Schema<IGoal>({
    title: { type: String, required: true },
    description: { type: String, required:true },
    type: { type: String, required: true, enum: ['personal', 'family'] },
    tasks: { type: [taskSchema], default: [] },
    isCompleted: { type: Boolean, default: false },
    completeBy: { type: Date, required: true },
    dueDate: { type: Date },
    rewards: {
        stars: { type: Number, default: 10 },
        coins: { type: Number, default: 5 },
        badge: { type: String },
    },
});
