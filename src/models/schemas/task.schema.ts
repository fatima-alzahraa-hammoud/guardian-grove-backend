import { Schema } from "mongoose";
import { ITask } from "../../interfaces/ITask";

export const taskSchema = new Schema<ITask>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required:true, enum: ['personal', 'family'] },
    isCompleted: { type: Boolean, default: false },
    createdAt: { type: Date  },
    completedAt: { type: Date },
    rewards: {
        stars: { type: Number, default: 2 },
        coins: { type: Number, default: 1 }
    },
});