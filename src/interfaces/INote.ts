import { Document } from "mongoose";

export interface INote extends Document {
    title: string;
    content: string;
    type: string;
    createdAt: Date;
    updatedAt: Date;
    isPinned: boolean;
}