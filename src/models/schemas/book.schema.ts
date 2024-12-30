import { Schema } from "mongoose";
import { IBook } from "../../interfaces/IBook";

export const bookSchema: Schema = new Schema<IBook>({
    title: { type: String, required: true },
    coverImage: { type: String, required: true },
    description: { type: String, required: true },
    author: { type: String, required: true },
    fileUrl: { type: String, required: true }, // URL to the uploaded book
    fileName: { type: String, required: true },
    fileType: { type: String, required: true }, // For example, 'pdf'
    uploadedAt: { type: Date, default: Date.now },
});