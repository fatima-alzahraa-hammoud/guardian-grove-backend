import { Document } from "mongoose";

interface INote extends Document {
    userId: string;
    title: string;
    content: string;
    type: string;
    createdAt: Date;
    updatedAt: Date;
    isPinned: boolean;
}