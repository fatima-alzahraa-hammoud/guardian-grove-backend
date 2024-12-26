import { Document } from "mongoose";

interface INote extends Document {
    title: string;
    content: string;
    type: string;
    createdAt: Date;
    updatedAt: Date;
    isPinned: boolean;
}