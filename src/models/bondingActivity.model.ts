import { Schema, model } from "mongoose";
import { IBondingActivity } from "../interfaces/IBondingActivity";

const bondingActivitySchema = new Schema<IBondingActivity>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    duration: { type: String, required: true },
    difficulty: { type: String, required: true },
    ageGroup: { type: String, required: true },
    participants: { type: String, required: true },
    materials: { type: [String], required: true },
    downloadUrl: { type: String, required: true },
    thumbnail: { type: String, required: true },
    rating: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    familyId: { type: Schema.Types.ObjectId, ref: 'Family' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export const BondingActivityModel = model<IBondingActivity>('BondingActivity', bondingActivitySchema);