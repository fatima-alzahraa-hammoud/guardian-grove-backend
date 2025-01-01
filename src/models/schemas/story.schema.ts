import { Schema, Types } from "mongoose";
import { IStory } from "../../interfaces/IStory";

export const storySchema = new Schema<IStory>({
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['personal', 'family'], default: 'personal' },
    collaborators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});