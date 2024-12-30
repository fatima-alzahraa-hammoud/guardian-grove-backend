import { Document } from "mongoose";

export interface IBook extends Document {
    title: string;
    coverImage: string;
    description: string;
    author:string;
    bookFile: string;
    uploadedAt: Date;
}