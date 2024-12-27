import { Schema } from "mongoose";
import { IGoal } from "../../interfaces/IGoal";
import { taskSchema } from "./task.schema";
import { Achievement } from "../achievements.model";

export const goalSchema = new Schema<IGoal>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
    description: { type: String, required:true },
    type: { type: String, required: true, enum: ['personal', 'family'] },
    tasks: { type: [taskSchema], default: [] },
    isCompleted: { type: Boolean, default: false },
    dueDate: { type: Date },
    rewards: {
        stars: { type: Number, default: 10 },
        coins: { type: Number, default: 5 },
        achievementName: { type: String },
        achievementId: { type: Schema.Types.ObjectId, ref: "Achievement" },     
    },
});
