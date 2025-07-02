import { Document, Types } from "mongoose";

export interface INote {
    _id: Types.ObjectId;
    title: string;
    content: string;
    backgroundColor: string;
    textColor: string;
    fontSize: number;
    isPinned: boolean;
    isChecklist: boolean;
    checklistItems: {
        id: string;
        text: string;
        completed: boolean;
    }[];
    type: 'personal' | 'family';
    createdAt: Date;
    updatedAt: Date;
}