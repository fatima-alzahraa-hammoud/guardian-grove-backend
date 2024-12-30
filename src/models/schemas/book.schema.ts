import { Schema } from "mongoose";
import { IBook } from "../../interfaces/IBook";

export const bookSchema: Schema = new Schema<IBook>({
    title: { type: String, required: true },
    coverImage: { type: String, required: true },
    description: { type: String, required: true },
    author: { type: String, required: true },
    bookFile: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
});