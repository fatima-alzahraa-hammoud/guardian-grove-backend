import { Schema } from "mongoose";
import { IColoring } from "../../interfaces/IColoring";

export const coloringSchema = new Schema<IColoring>({
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});