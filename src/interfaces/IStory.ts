import { Document, Types } from "mongoose";

export interface IStory extends Document{
    title: string;
    content: Text;
    type: 'personal' | 'family';
    collaborators: Types.ObjectId[];
    createdAt: Date;
}