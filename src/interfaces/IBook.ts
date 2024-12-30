import { Date, Document } from "mongoose";

export interface IBook extends Document {
    title: string;
    coverImage: string;
    description: string;
    author:string,
    fileUrl: string,
    fileName: string,
    fileType: string,
    uploadedAt: Date,
}
  