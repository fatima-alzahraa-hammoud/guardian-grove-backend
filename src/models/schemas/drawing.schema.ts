import { Schema } from "mongoose";
import { IDrawing } from "../../interfaces/IDrawing";

export const drawingSchema = new Schema<IDrawing>({
    title: { type: String, required: true },
    drawing: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});