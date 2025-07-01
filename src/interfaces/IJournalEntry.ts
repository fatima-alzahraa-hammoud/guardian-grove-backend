import { Types } from "mongoose";

export interface JournalEntry {
    _id: Types.ObjectId;
    familyId: Types.ObjectId;
    userId: Types.ObjectId;
    type: 'text' | 'image' | 'video' | 'audio';
    title: string;
    content: string;
    thumbnail?: string;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
}