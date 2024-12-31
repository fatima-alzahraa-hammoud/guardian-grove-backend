import { Document, Types } from "mongoose";

export interface IStory extends Document{
    title: string;
    content: string;
    type: 'personal' | 'family';
    collaborators: Types.ObjectId[];
    createdAt: Date;
}