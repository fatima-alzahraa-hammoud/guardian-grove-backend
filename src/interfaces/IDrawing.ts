import { Document } from "mongoose";

export interface IDrawing extends Document{
    title: string;
    drawing: string;
    createdAt: Date;
}
