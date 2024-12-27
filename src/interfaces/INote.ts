import { Document, Types } from "mongoose";

export interface INote extends Document {
    _id : Types.ObjectId;
    title: string;
    content: string;
    type: string;
    createdAt: Date;
    updatedAt: Date;
    isPinned: boolean;
}