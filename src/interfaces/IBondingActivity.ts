import { Types } from "mongoose";

export interface IBondingActivity {
    title: string;
    description: string;
    category: string;
    duration: string;
    difficulty: string;
    ageGroup: string;
    participants: string;
    materials: string[];
    downloadUrl: string;
    thumbnail: string;
    rating?: number;
    downloads?: number;
    familyId?: Types.ObjectId;
    createdBy?: Types.ObjectId;
}