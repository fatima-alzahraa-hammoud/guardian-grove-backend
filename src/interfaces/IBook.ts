import { Document } from "mongoose";

export interface Book extends Document {
    title: string;
    coverImage: string;
    description: string;
    filePath: string;
    userId: string;
}
  